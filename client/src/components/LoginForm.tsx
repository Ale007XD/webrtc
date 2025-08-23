import React, { useState } from 'react';

interface LoginFormProps {
  onLogin: (userId: string, token: string) => void;
  onError: (error: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin, onError }) => {
  const [formData, setFormData] = useState({
    userId: '',
    accessCode: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.userId || !formData.accessCode) {
      onError('Заполните все поля');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка входа');
      }

      onLogin(data.userId, data.token);
    } catch (error: any) {
      onError(error.message || 'Ошибка подключения к серверу');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="login-form">
      <div className="login-container">
        <div className="login-header">
          <h1>🔐 WebRTC E2EE</h1>
          <p>Защищенные видеозвонки с сквозным шифрованием</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form-inner">
          <div className="form-group">
            <label htmlFor="userId">ID пользователя:</label>
            <input
              type="text"
              id="userId"
              name="userId"
              value={formData.userId}
              onChange={handleInputChange}
              placeholder="Введите ваш ID"
              disabled={isLoading}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="accessCode">Код доступа:</label>
            <input
              type="password"
              id="accessCode"
              name="accessCode"
              value={formData.accessCode}
              onChange={handleInputChange}
              placeholder="Введите код доступа"
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? '⏳ Вход...' : '🚀 Войти'}
          </button>
        </form>

        <div className="security-info">
          <h3>🛡️ Безопасность</h3>
          <ul>
            <li>✅ Сквозное шифрование всех звонков</li>
            <li>✅ Обход блокировок через TURN 443/TLS</li>
            <li>✅ Только авторизованные пользователи</li>
            <li>✅ Короткоживущие токены доступа</li>
          </ul>
        </div>

        <div className="browser-info">
          <h3>📱 Совместимость</h3>
          <p>
            <strong>Рекомендуется:</strong> Chrome/Chromium 88+ (Android/Desktop)<br/>
            <strong>Поддерживается:</strong> Edge 88+, Firefox 117+<br/>
            <strong>Не поддерживается:</strong> Safari (нет Encoded Transforms)
          </p>
        </div>
      </div>

      <style jsx>{`
        .login-form {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }

        .login-container {
          background: white;
          padding: 40px;
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          max-width: 500px;
          width: 100%;
        }

        .login-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .login-header h1 {
          color: #333;
          margin-bottom: 10px;
          font-size: 2.5em;
        }

        .login-header p {
          color: #666;
          font-size: 16px;
        }

        .login-form-inner {
          margin-bottom: 30px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          color: #333;
          font-weight: bold;
        }

        .form-group input {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e1e1e1;
          border-radius: 10px;
          font-size: 16px;
          transition: all 0.3s ease;
        }

        .form-group input:focus {
          outline: none;
          border-color: #4A90E2;
          box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
        }

        .form-group input:disabled {
          background-color: #f8f9fa;
          cursor: not-allowed;
        }

        .login-button {
          width: 100%;
          background: #4A90E2;
          color: white;
          border: none;
          padding: 15px 20px;
          border-radius: 10px;
          font-size: 18px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .login-button:hover:not(:disabled) {
          background: #357abd;
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(74, 144, 226, 0.3);
        }

        .login-button:disabled {
          background: #ccc;
          cursor: not-allowed;
          transform: none;
        }

        .security-info, .browser-info {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 20px;
        }

        .security-info h3, .browser-info h3 {
          color: #333;
          margin-bottom: 15px;
          font-size: 18px;
        }

        .security-info ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .security-info li {
          padding: 5px 0;
          color: #555;
          font-size: 14px;
        }

        .browser-info p {
          color: #555;
          font-size: 14px;
          line-height: 1.5;
          margin: 0;
        }

        @media (max-width: 768px) {
          .login-container {
            margin: 10px;
            padding: 30px 20px;
          }

          .login-header h1 {
            font-size: 2em;
          }
        }
      `}</style>
    </div>
  );
};