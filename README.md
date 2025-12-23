# AI-Powered Code Editor

A complete AI-powered code editor built with React, Monaco Editor, Node.js, and OpenAI integration. This editor provides a modern, feature-rich development environment with intelligent code assistance.

## Features

### 🎯 Core Editor Features
- **Monaco Editor Integration**: Full-featured code editor with syntax highlighting for 30+ languages
- **File System Management**: Create, delete, rename files and folders
- **Tabbed Interface**: Multiple file support with tab management
- **Light/Dark Themes**: Seamless theme switching with smooth transitions
- **Export Project**: Download entire workspace as ZIP

### 🤖 AI-Powered Features
- **AI Autocomplete**: Context-aware code suggestions using GPT models
- **AI Error Detection**: ESLint integration with AI-powered explanations
- **AI Bug Fixing**: Intelligent code fixes and improvements
- **AI Code Explanation**: Natural language explanations of complex code
- **AI Code Refactoring**: Smart refactoring suggestions

### 🧠 Intelligent Assistant
- **Chat Sidebar**: AI assistant with code context awareness
- **Code Analysis**: Function/class detection and navigation
- **Problem Detection**: Real-time error and warning highlighting
- **Quick Actions**: One-click code analysis commands

### 🔍 Developer Tools
- **Search & Replace**: Project-wide search with regex support
- **Command Palette**: Quick access to all editor commands
- **Quick Open**: Fast file navigation
- **Problems Panel**: Centralized error and warning display
- **Terminal**: Built-in terminal for commands

### ⌨️ Keyboard Shortcuts
- **Ctrl/Cmd + S**: Save file
- **Ctrl/Cmd + N**: New file
- **Ctrl/Cmd + Shift + N**: New folder
- **Ctrl/Cmd + W**: Close tab
- **Ctrl/Cmd + P**: Quick open
- **Ctrl/Cmd + Shift + P**: Command palette
- **Ctrl/Cmd + E**: Toggle explorer
- **Ctrl/Cmd + F**: Toggle search
- **Ctrl/Cmd + Shift + M**: Toggle problems
- **Ctrl/Cmd + I**: Toggle AI assistant
- **Ctrl/Cmd + Shift + T**: Toggle theme

### 📝 File Operations
- **Create Files/Folders**: Click buttons or use keyboard shortcuts
- **Rename Files/Folders**: Right-click or use Edit menu
- **Delete Files/Folders**: Right-click or use Edit menu
- **Modal Dialogs**: Professional naming interface with validation
- **Smart Defaults**: Automatic name suggestions based on context

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and build
- **Monaco Editor** for code editing
- **CSS Modules** for styling

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **ESLint** for JavaScript/TypeScript linting

### AI Integration
- **OpenAI API** for AI features
- **GPT-4o-mini** (configurable) for code assistance

## Project Structure

```
AI-Editor/
├── frontend/           # React frontend application
│   ├── src/
│   │   ├── components/ # UI components
│   │   ├── api/        # API client
│   │   └── styles.css  # Global styles
│   ├── package.json
│   └── vite.config.ts
├── backend/            # Node.js backend server
│   ├── src/
│   │   └── server.ts   # Express server
│   ├── package.json
│   └── tsconfig.json
├── shared/             # Shared types and utilities
│   └── index.ts
└── README.md
```

## Installation

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AI-Editor
   ```

2. **Install dependencies**
   ```bash
   # Install frontend dependencies
   cd frontend
   npm install
   
   # Install backend dependencies
   cd ../backend
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the `backend/` directory:
   ```env
   PORT=4000
   AI_API_KEY=your_openai_api_key_here
   AI_MODEL=gpt-4o-mini
   ```

4. **Build and run**
   ```bash
   # Build frontend
   cd frontend
   npm run build
   
   # Start backend server
   cd ../backend
   npm run dev
   ```

5. **Open the editor**
   Navigate to `http://localhost:4000` in your browser.

## Configuration

### AI Model Configuration
Edit the `AI_MODEL` environment variable in `backend/.env`:
- `gpt-4o-mini` (default, cost-effective)
- `gpt-4o` (more powerful)
- `gpt-4` (legacy)
- `gpt-3.5-turbo` (budget option)

### Port Configuration
Change the `PORT` environment variable in `backend/.env` to use a different port.

## Usage

### Getting Started
1. **Create a new project**: Click "New File" or use Ctrl/Cmd+N
2. **Write code**: The editor supports syntax highlighting for 30+ languages
3. **Use AI features**: Select code and use the AI buttons or Command Palette
4. **Save your work**: Files are saved locally in the workspace folder

### AI Features
- **Autocomplete**: Press Ctrl/Cmd+Space for AI suggestions
- **Error Detection**: View errors in the Problems panel (Ctrl/Cmd+Shift+M)
- **Code Explanation**: Ask the AI assistant about your code
- **Refactoring**: Get AI suggestions for improving your code

### File Management
- **Create Files/Folders**: Right-click in the file explorer
- **Rename/Delete**: Use the context menu or Command Palette
- **Search**: Use Ctrl/Cmd+F for project-wide search
- **Export**: Use File → Export ZIP to download your project

## Supported Languages

The editor supports syntax highlighting and basic IntelliSense for:
- JavaScript, TypeScript, JSX, TSX
- Python, Java, C/C++, C#
- HTML, CSS, SCSS, Sass, Less
- JSON, YAML, XML
- Markdown, Vue, Svelte
- Go, Rust, PHP, Ruby, Swift, Kotlin, Scala
- Shell scripts, PowerShell, SQL

## Development

### Running in Development Mode
```bash
# Start frontend in dev mode
cd frontend
npm run dev

# Start backend in dev mode
cd ../backend
npm run dev
```

### Adding New AI Features
1. Add new endpoints to `backend/src/server.ts`
2. Create corresponding API functions in `frontend/src/api/client.ts`
3. Add UI components and integrate with the main App

### Customizing Themes
Edit the CSS custom properties in `frontend/src/styles.css`:
- `--bg`: Background color
- `--panel`: Panel background
- `--text`: Text color
- `--accent`: Accent color
- `--border`: Border color

## Troubleshooting

### Common Issues

**AI features not working**:
- Check your OpenAI API key in `backend/.env`
- Verify your OpenAI account has sufficient credits
- Check the browser console for error messages

**Monaco Editor not loading**:
- Clear your browser cache
- Check the network tab for failed requests
- Ensure the frontend is properly built

**File operations failing**:
- Check backend server is running
- Verify file permissions
- Check the backend logs for errors

### Performance Tips
- Use the search feature with specific queries to improve performance
- Close unused tabs to free up memory
- For large files, consider splitting them into smaller chunks

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

- **Documentation**: This README file
- **Issues**: Use GitHub Issues for bug reports and feature requests
- **Contributing**: See the Contributing section above

## Acknowledgments

- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - The excellent code editor that powers this application
- [React](https://react.dev/) - The library that makes the UI development enjoyable
- [OpenAI](https://openai.com/) - For providing the powerful AI models
- [ESLint](https://eslint.org/) - For JavaScript/TypeScript linting capabilities

---

**Note**: This is a desktop application. For the best experience, consider packaging it with Electron or running it in a modern browser.
