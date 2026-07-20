import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';
import { FiCheck, FiCheckAll, FiTrash2, FiBell } from 'react-icons/fi';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import toast from 'react-hot-toast';

const Notifications = () => {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0
  });

  useEffect(() => {
    fetchNotifications();
  }, [filter, pagination.page]);

  const fetchNotifications = async () => {
    try {
      const params = {
        page: pagination.page,
        limit: 20
      };
      
      if (filter === 'unread') {
        params.unreadOnly = 'true';
      }

      const response = await api.get('/notifications', { params });
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unreadCount);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error(t.errorFetchingNotifications);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, isRead: true } : n
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      toast.error(t.errorUpdatingNotification);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success(t.allNotificationsRead);
    } catch (error) {
      toast.error(t.errorUpdatingNotifications);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(notifications.filter(n => n.id !== id));
      toast.success(t.notificationDeleted);
    } catch (error) {
      toast.error(t.errorDeletingNotification);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'case_update':
        return '📋';
      case 'session_reminder':
        return '⏰';
      case 'session_scheduled':
        return '📅';
      case 'deadline':
        return '⚠️';
      default:
        return '🔔';
    }
  };

  if (loading) {
    return <div className="loading">{t.loading}</div>;
  }

  return (
    <div className="notifications-page">
      <div className="card-header">
        <h2 className="card-title">
          <FiBell /> {t.notifications}
          {unreadCount > 0 && (
            <span className="notification-count">{unreadCount}</span>
          )}
        </h2>
        {unreadCount > 0 && (
          <button className="btn btn-secondary" onClick={markAllAsRead}>
            <FiCheckAll /> {t.markAllRead}
          </button>
        )}
      </div>

      <div className="filter-tabs">
        <button 
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          {t.allNotifications}
        </button>
        <button 
          className={`filter-tab ${filter === 'unread' ? 'active' : ''}`}
          onClick={() => setFilter('unread')}
        >
          {t.unread} ({unreadCount})
        </button>
      </div>

      {notifications.length > 0 ? (
        <div className="notifications-list">
          {notifications.map((notification) => (
            <div 
              key={notification.id} 
              className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
            >
              <div className="notification-icon">
                {getNotificationIcon(notification.type)}
              </div>
              
              <div className="notification-content">
                <h4>{notification.title}</h4>
                <p>{notification.message}</p>
                <span className="notification-date">
                  {format(new Date(notification.createdAt), 'dd/MM/yyyy HH:mm', { locale: ar })}
                </span>
                {notification.Case && (
                  <span className="notification-case">
                    {notification.Case.caseNumber} - {notification.Case.title}
                  </span>
                )}
              </div>
              
              <div className="notification-actions">
                {!notification.isRead && (
                  <button 
                    className="btn btn-secondary"
                    onClick={() => markAsRead(notification.id)}
                    title={t.markAsRead}
                  >
                    <FiCheck />
                  </button>
                )}
                <button 
                  className="btn btn-danger"
                  onClick={() => deleteNotification(notification.id)}
                  title={t.delete}
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-notifications">
          <FiBell size={48} />
          <p>{t.noNotifications}</p>
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="pagination">
          <button 
            className="btn btn-secondary"
            disabled={pagination.page === 1}
            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
          >
            {t.previous}
          </button>
          <span>{t.page} {pagination.page} {t.of} {pagination.pages}</span>
          <button 
            className="btn btn-secondary"
            disabled={pagination.page === pagination.pages}
            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
          >
            {t.next}
          </button>
        </div>
      )}
    </div>
  );
};

export default Notifications;
