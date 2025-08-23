import React, { useState, useEffect } from 'react';

interface Contact {
  userId: string;
  name?: string;
  isOnline?: boolean;
}

interface ContactListProps {
  currentUserId: string;
  onStartCall: (remoteUserId: string) => void;
  onError: (error: string) => void;
}

export const ContactList: React.FC<ContactListProps> = ({
  currentUserId,
  onStartCall,
  onError
}) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        onError('Не найден токен аутентификации');
        return;
      }

      const response = await fetch(`/api/contacts`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Не удалось загрузить контакты');
      }

      const data = await response.json();
      setContacts(data.contacts || []);
    } catch (error) {
      console.error('Failed to load contacts:', error);
      onError('Не удалось загрузить список контактов');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCallContact = (contactId: string) => {
    onStartCall(contactId);
  };

  if (isLoading) {
    return (
      <div className="contact-list loading">
        <div className="loader">⏳ Загрузка контактов...</div>
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="contact-list empty">
        <div className="empty-message">
          <h3>📞 Нет доступных контактов</h3>
          <p>Обратитесь к администратору для добавления контактов</p>
        </div>
      </div>
    );
  }

  return (
    <div className="contact-list">
      <h2>📋 Контакты</h2>
      <div className="contacts-grid">
        {contacts.map((contact) => (
          <div key={contact.userId} className="contact-card">
            <div className="contact-info">
              <div className="contact-avatar">
                {contact.name ? contact.name[0].toUpperCase() : contact.userId[0].toUpperCase()}
              </div>
              <div className="contact-details">
                <div className="contact-name">
                  {contact.name || contact.userId}
                </div>
                <div className={`contact-status ${contact.isOnline ? 'online' : 'offline'}`}>
                  {contact.isOnline ? '🟢 В сети' : '⚪ Не в сети'}
                </div>
              </div>
            </div>
            <button
              className="call-button"
              onClick={() => handleCallContact(contact.userId)}
              disabled={!contact.isOnline}
            >
              📞 Позвонить
            </button>
          </div>
        ))}
      </div>

      <div className="info-panel">
        <h3>🔒 Безопасность</h3>
        <ul>
          <li>✅ Сквозное шифрование AES-256-GCM</li>
          <li>✅ Проверка подлинности по SAS коду</li>
          <li>✅ Ротация ключей каждые 5 минут</li>
          <li>✅ Обход блокировок через TURN 443/TLS</li>
        </ul>
      </div>

      <style jsx>{`
        .contact-list {
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
        }

        .contact-list h2 {
          color: #333;
          margin-bottom: 20px;
          text-align: center;
        }

        .loading, .empty {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 200px;
          color: #666;
        }

        .loader {
          font-size: 18px;
        }

        .empty-message {
          text-align: center;
        }

        .empty-message h3 {
          color: #666;
          margin-bottom: 10px;
        }

        .contacts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .contact-card {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.2s ease;
        }

        .contact-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }

        .contact-info {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .contact-avatar {
          width: 50px;
          height: 50px;
          background: #4A90E2;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 20px;
        }

        .contact-details {
          flex: 1;
        }

        .contact-name {
          font-weight: bold;
          color: #333;
          margin-bottom: 5px;
        }

        .contact-status {
          font-size: 14px;
          color: #666;
        }

        .contact-status.online {
          color: #28a745;
        }

        .call-button {
          background: #4A90E2;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 25px;
          cursor: pointer;
          font-size: 14px;
          font-weight: bold;
          transition: all 0.2s ease;
        }

        .call-button:hover:not(:disabled) {
          background: #357abd;
          transform: scale(1.05);
        }

        .call-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .info-panel {
          background: #e8f4fd;
          border: 1px solid #b8daff;
          border-radius: 12px;
          padding: 20px;
        }

        .info-panel h3 {
          color: #004085;
          margin-bottom: 15px;
        }

        .info-panel ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .info-panel li {
          padding: 8px 0;
          color: #004085;
          font-size: 14px;
        }

        @media (max-width: 768px) {
          .contacts-grid {
            grid-template-columns: 1fr;
          }

          .contact-card {
            flex-direction: column;
            gap: 15px;
            text-align: center;
          }

          .call-button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};