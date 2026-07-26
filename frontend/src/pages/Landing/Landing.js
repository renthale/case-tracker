import React from 'react';
import { Link } from 'react-router-dom';
import { FiBriefcase, FiUser } from 'react-icons/fi';
import './Landing.css';

const Landing = () => {
  return (
    <div className="landing">
      <div className="landing-bg"></div>
      <div className="landing-content">
        <div className="landing-header">
          <h1>نظام إدارة القضايا</h1>
          <p>Case Management System</p>
          <div className="landing-divider"></div>
        </div>

        <div className="landing-cards">
          <Link to="/login" className="landing-card firm-card">
            <div className="landing-card-icon">
              <FiBriefcase size={64} />
            </div>
            <h2>الدخول للمكتب القانوني</h2>
            <p>Law Firm Portal</p>
            <span className="landing-card-desc">
              المحامون، الشركاء، الموظفون، وكلاء المحاكم
            </span>
            <span className="landing-card-desc-en">
              Lawyers, Partners, Staff & Court Agents
            </span>
            <div className="landing-card-arrow">→</div>
          </Link>

          <Link to="/portal/login" className="landing-card client-card">
            <div className="landing-card-icon">
              <FiUser size={64} />
            </div>
            <h2>بوابة العميل</h2>
            <p>Client Portal</p>
            <span className="landing-card-desc">
              متابعة القضايا، الفواتير، والجلسات
            </span>
            <span className="landing-card-desc-en">
              View your cases, invoices & sessions
            </span>
            <div className="landing-card-arrow">→</div>
          </Link>
        </div>

        <div className="landing-footer">
          <p>© 2026 مكتب المحاماة — جميع الحقوق محفوظة</p>
        </div>
      </div>
    </div>
  );
};

export default Landing;
