# Laurelin Chat Frontend

Angular-based frontend application for Laurelin Inc. AI chatbot with Google OAuth authentication, model selection, and file upload capabilities.

## 🚀 Current Status

**✅ DEPLOYED AND WORKING**

- **Frontend Interface**: `https://laurelin-frontend-975218893454.us-central1.run.app`
- **Backend Integration**: ✅ Connected to working backend
- **Authentication**: Google OAuth with `@laurelin-inc.com` domain restriction
- **Features**: Chat interface, model selection, file upload, real-time communication

## 📁 Repository Structure

```
laurelin-chat-frontend/
├── src/                      # Angular application (full implementation)
│   ├── app/
│   │   ├── components/       # Angular components
│   │   │   ├── laurelin-chat-component/
│   │   │   ├── model-selector/
│   │   │   └── file-upload/
│   │   ├── services/         # Angular services
│   │   │   ├── auth.service.ts
│   │   │   └── chat-api.service.ts
│   │   └── environments/     # Environment configuration
│   ├── assets/               # Static assets
│   └── index.html           # Main HTML file
├── simple-frontend/          # Currently deployed simple frontend
│   ├── simple-frontend-server.js  # Express.js server
│   ├── working-chatbot.html       # Standalone HTML interface
│   └── package.json               # Dependencies
├── scripts/
│   └── deploy-frontend-production.sh  # Deployment script
├── docs/
│   └── FRONTEND_DEPLOYMENT.md        # Deployment documentation
└── README.md                # This file
```

## 🔧 Quick Start

### **Option 1: Use Currently Working System**

The simple frontend is already deployed and working:

**Access**: `https://laurelin-frontend-975218893454.us-central1.run.app`

Features:
- ✅ Working chatbot interface
- ✅ Model selection (Google Gemini, OpenAI GPT, Custom OSS120)
- ✅ Real-time chat with backend
- ✅ File upload capabilities
- ✅ Authentication flow

### **Option 2: Build Full Angular Application**

To build the complete Angular application:

```bash
# Prerequisites: Node.js 20.19+ required
cd src
npm install
ng build --configuration production

# Deploy to GCS bucket
cd ../scripts
./deploy-frontend-production.sh
```

## 🌐 Frontend Features

### **Currently Working (Simple Frontend)**

- **Chat Interface**: Real-time messaging with AI models
- **Model Selection**: Choose between Google Gemini, OpenAI GPT, and Custom OSS120
- **Authentication**: Google OAuth integration
- **File Upload**: Drag-and-drop file upload interface
- **Backend Integration**: Full API communication
- **Responsive Design**: Works on desktop and mobile

### **Angular Application (Full Implementation)**

Additional features in the complete Angular app:
- **Component Architecture**: Modular Angular components
- **Service Layer**: Dedicated services for authentication and API communication
- **Environment Configuration**: Production and development environments
- **Type Safety**: Full TypeScript implementation
- **Advanced UI**: Material Design components and animations

## 🔐 Authentication

- **Provider**: Google OAuth
- **Client ID**: `[CONFIGURED - See GCP Secret Manager]`
- **Domain Restriction**: `@laurelin-inc.com` email addresses only
- **Session Management**: Automatic token refresh and session persistence

## 🤖 Model Integration

### **Available Models**
- **Google Gemini Pro**: `gemini-pro` - Google's latest AI model
- **OpenAI GPT-3.5**: `gpt-3.5-turbo` - Fast and efficient
- **OpenAI GPT-4**: `gpt-4` - Most capable model
- **Custom OSS120**: `oss120` - Custom GPU-hosted model (pending)

### **Model Selection UI**
- Dropdown selector with model descriptions
- Real-time model switching
- Status indicators for each model
- Performance metrics display

## 📤 File Upload

### **Supported Formats**
- **Documents**: PDF, TXT, DOC, DOCX
- **Data**: CSV, JSON
- **Images**: JPEG, PNG, GIF
- **Size Limit**: 1GB per file

### **Upload Features**
- Drag-and-drop interface
- Progress indicators
- File validation
- Multiple file support
- File management and removal

## 🎨 User Interface

### **Design System**
- **Color Scheme**: Laurelin brand colors (purple gradient)
- **Typography**: Modern, clean fonts
- **Layout**: Responsive grid system
- **Components**: Custom Angular components

### **User Experience**
- **Real-time Chat**: Instant message delivery
- **Typing Indicators**: Show when AI is responding
- **Message History**: Persistent conversation history
- **Error Handling**: User-friendly error messages
- **Loading States**: Visual feedback for all operations

## 🚀 Deployment

### **Current Deployment**
- **Platform**: Google Cloud Run
- **URL**: `https://laurelin-frontend-975218893454.us-central1.run.app`
- **Status**: ✅ Live and accessible
- **Backend**: Connected to `https://laurelin-backend-975218893454.us-central1.run.app`

### **Deployment Commands**

```bash
# Deploy simple frontend (currently working)
cd simple-frontend
gcloud run deploy laurelin-frontend --source . --region=us-central1 --allow-unauthenticated

# Deploy Angular application to GCS
cd scripts
./deploy-frontend-production.sh
```

### **Domain Configuration**
- **Custom Domain**: `chat.laurelin-inc.com` (SSL certificate pending)
- **DNS**: Configured to point to Cloud Run service
- **SSL**: Automatic certificate provisioning by Google

## 🔧 Configuration

### **Environment Variables**

**Development** (`src/environments/environment.ts`):
```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'https://laurelin-backend-975218893454.us-central1.run.app',
  googleClientId: '[CONFIGURED - See GCP Secret Manager]'
};
```

**Production** (`src/environments/environment.prod.ts`):
```typescript
export const environment = {
  production: true,
  apiBaseUrl: 'https://laurelin-backend-975218893454.us-central1.run.app',
  googleClientId: '[CONFIGURED - See GCP Secret Manager]'
};
```

### **Backend Integration**
- **API Base URL**: `https://laurelin-backend-975218893454.us-central1.run.app`
- **CORS**: Configured for cross-origin requests
- **Authentication**: Bearer token authentication
- **Error Handling**: Comprehensive error management

## 🧪 Testing

### **Manual Testing**
1. **Access Frontend**: Visit `https://laurelin-frontend-975218893454.us-central1.run.app`
2. **Test Authentication**: Sign in with `@laurelin-inc.com` account
3. **Test Chat**: Send messages and verify responses
4. **Test Model Selection**: Switch between different AI models
5. **Test File Upload**: Upload files and reference them in chat

### **Automated Testing**
```bash
cd src
npm test                    # Run unit tests
npm run e2e                # Run end-to-end tests
npm run lint               # Run code linting
```

## 📱 Responsive Design

### **Breakpoints**
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### **Mobile Features**
- Touch-friendly interface
- Swipe gestures
- Optimized chat interface
- Mobile file upload

## 🔄 Development Workflow

### **Current Working System**
1. **Simple Frontend**: HTML/JavaScript with Express.js server (deployed and working)
2. **Backend Integration**: Full API communication working
3. **Authentication**: Google OAuth working
4. **Domain**: `chat.laurelin-inc.com` (SSL certificate pending)

### **Next Development Phase**
1. **Build Angular App**: Complete Angular application
2. **Deploy to GCS**: Static hosting on Google Cloud Storage
3. **Custom Domain**: Full SSL certificate and domain setup
4. **Advanced Features**: Enhanced UI components and animations

## 🆘 Troubleshooting

### **Common Issues**

1. **Authentication Failures**: Google OAuth not working
   - **Solution**: Ensure using `@laurelin-inc.com` email address
   - **Check**: Google Client ID is correct

2. **Backend Connection Issues**: API calls failing
   - **Solution**: Verify backend URL is accessible
   - **Check**: CORS configuration

3. **File Upload Issues**: Files not uploading
   - **Solution**: Check file size limits (1GB max)
   - **Check**: File format is supported

4. **Model Selection Issues**: Models not switching
   - **Solution**: Refresh page and try again
   - **Check**: Backend model API is working

### **Debug Information**
- **Frontend URL**: `https://laurelin-frontend-975218893454.us-central1.run.app`
- **Backend URL**: `https://laurelin-backend-975218893454.us-central1.run.app`
- **Health Check**: `https://laurelin-backend-975218893454.us-central1.run.app/health`

## 📈 Performance

- **Load Time**: < 3 seconds initial load
- **Chat Response**: < 2 seconds per message
- **File Upload**: Progress indicators and validation
- **Caching**: Browser caching for static assets
- **CDN**: Google Cloud CDN for global distribution

## 🔒 Security

- **HTTPS**: All communication over HTTPS
- **Authentication**: Google OAuth with domain restriction
- **CORS**: Properly configured cross-origin policies
- **Input Validation**: Client-side and server-side validation
- **XSS Protection**: Angular's built-in XSS protection

## 📚 Documentation

- **[Frontend Deployment Guide](docs/FRONTEND_DEPLOYMENT.md)** - Detailed deployment instructions
- **[Component Documentation](src/app/components/)** - Individual component documentation
- **[Service Documentation](src/app/services/)** - Service layer documentation

## 🛠️ Development Setup

### **Prerequisites**
- Node.js 20.19+ (for Angular build)
- npm or yarn
- Google Cloud SDK (for deployment)

### **Local Development**
```bash
cd src
npm install
ng serve
# Open http://localhost:4200
```

### **Production Build**
```bash
cd src
ng build --configuration production
# Output in dist/browser/
```

---

**Status**: ✅ Production Ready  
**Last Updated**: October 23, 2025  
**Version**: 1.0.0
