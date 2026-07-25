const { Case, Client } = require('../models');
const { Op } = require('sequelize');

exports.checkConflict = async (req, res) => {
  try {
    const { opposingParty, opposingCivilId, clientId } = req.body;

    if (!opposingParty && !opposingCivilId) {
      return res.json({ conflicts: [], hasConflict: false });
    }

    const conflicts = [];

    // Check if opposing party is a current client
    if (opposingParty) {
      const clientAsOpposing = await Client.findOne({
        where: {
          [Op.or]: [
            { name: { [Op.iLike]: `%${opposingParty}%` } },
            { phone: { [Op.iLike]: `%${opposingParty}%` } }
          ]
        }
      });

      if (clientAsOpposing) {
        const clientCases = await Case.findAll({
          where: {
            clientId: clientAsOpposing.id,
            status: { [Op.in]: ['active', 'pending'] }
          },
          attributes: ['id', 'caseNumber', 'title', 'status']
        });

        if (clientCases.length > 0) {
          conflicts.push({
            type: 'client_conflict',
            message: `الطرف المقابل "${opposingParty}" هو عميل حالي في firm`,
            severity: 'high',
            relatedCases: clientCases
          });
        }
      }
    }

    // Check if opposing party appears in other active cases
    if (opposingParty) {
      const opposingInCases = await Case.findAll({
        where: {
          opposingParty: { [Op.iLike]: `%${opposingParty}%` },
          status: { [Op.in]: ['active', 'pending'] },
          clientId: clientId ? { [Op.ne]: clientId } : { [Op.not]: null }
        },
        attributes: ['id', 'caseNumber', 'title', 'status', 'assignedLawyerId'],
        include: [{ model: Client, as: 'client', attributes: ['id', 'name'] }]
      });

      if (opposingInCases.length > 0) {
        conflicts.push({
          type: 'opposing_in_other_cases',
          message: `الطرف المقابل "${opposingParty}" له ${opposingInCases.length} قضية نشطة أخرى في النظام`,
          severity: 'medium',
          relatedCases: opposingInCases
        });
      }
    }

    // Check if client has cases against the same opposing party
    if (clientId && opposingParty) {
      const clientOpposingCases = await Case.findAll({
        where: {
          clientId,
          opposingParty: { [Op.iLike]: `%${opposingParty}%` },
          status: { [Op.in]: ['active', 'pending'] }
        },
        attributes: ['id', 'caseNumber', 'title', 'status']
      });

      if (clientOpposingCases.length > 0) {
        conflicts.push({
          type: 'duplicate_case',
          message: `العميل لديه قضية نشطة أخرى ضد نفس الطرف "${opposingParty}"`,
          severity: 'low',
          relatedCases: clientOpposingCases
        });
      }
    }

    res.json({
      hasConflict: conflicts.length > 0,
      conflicts,
      checkedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في فحص تعارض المصالح', details: error.message });
  }
};
