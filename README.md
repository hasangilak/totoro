# CM Git Workbench

A modern, professional code editor inspired by EDD design - built with React, TypeScript, and CodeMirror 6. Features beautiful dark theme, file tree navigation, Git integration, and real-time editing capabilities.

![CM Git Workbench](https://github.com/user-attachments/assets/code-editor-preview)

## ✨ Features

### 🎨 **Modern EDD-Inspired Design**
- Beautiful dark theme with purple accent colors
- Clean, professional interface matching modern code editors
- Responsive layout with sidebar, editor, and console panels

### 📁 **File Management**
- Collapsible file tree with folder/file icons
- Multiple tab support with close buttons
- Quick file navigation and search
- Real-time file system monitoring

### 💻 **Advanced Code Editor**
- CodeMirror 6 with syntax highlighting for multiple languages
- Line numbers and code folding
- Dark theme optimized for long coding sessions
- Auto-save functionality with visual indicators

### 🔄 **Git Integration**
- Real-time Git status monitoring
- File change indicators in the file tree
- Staging/unstaging capabilities
- Branch information display

### 🔧 **Developer Experience**
- Hot reload for instant development feedback
- Console panel with build output
- Keyboard shortcuts for productivity
- Status indicators (file count, encoding, issues)

## 🚀 Quickstart

1. **Prerequisites**: Make sure your target project directory is a **Git repo**.

2. **Installation & Setup**:
   ```bash
   # Clone or download this repository
   cd cm-git-workbench
   
   # Install all dependencies
   npm run install:all
   
   # Start development servers
   npm run dev
   ```

3. **Access the Editor**: Open http://localhost:5173 in your browser
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3002

## 📦 Project Structure

```
cm-git-workbench/
├── frontend/          # React + TypeScript frontend
│   ├── src/
│   │   ├── components/    # UI components (FileTree, CodeEditor, Tabs, etc.)
│   │   ├── lib/          # API utilities and types
│   │   └── styles.css    # Tailwind CSS + custom styles
│   └── package.json
├── backend/           # Express.js backend
│   ├── src/
│   │   └── server.ts     # File system & Git API server
│   └── package.json
└── package.json       # Workspace configuration
```

## 🔧 Configuration

### Environment Variables
```bash
# Set workspace directory (optional, defaults to current directory)
export WORKSPACE_DIR="/path/to/your/project"

# Windows PowerShell
$env:WORKSPACE_DIR="C:\path\to\your\project"
```

### Optional Enhancements
Install `ripgrep` for faster file search:
- **macOS**: `brew install ripgrep`
- **Ubuntu/Debian**: `sudo apt-get install ripgrep`
- **Windows**: `choco install ripgrep`

## 🎯 Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Editor**: CodeMirror 6 with syntax highlighting
- **Backend**: Express.js, Node.js
- **File System**: Native fs with chokidar for watching
- **Git**: Simple-git for Git operations
- **Real-time**: WebSocket for live updates

## 🎨 Design Philosophy

This project implements the beautiful EDD code editor design, featuring:
- **Dark theme** optimized for developer productivity
- **Clean typography** with proper font stacks
- **Intuitive navigation** with collapsible panels
- **Modern UI patterns** following best practices
- **Accessibility** considerations throughout

## 🤝 Contributing

Contributions are welcome! This project aims to provide a clean, modern code editing experience. Please feel free to:

1. Fork the repository
2. Create a feature branch
3. Make your improvements
4. Submit a pull request

## 📄 License

MIT License - feel free to use this project for learning or as a foundation for your own code editor!

---

**Built with ❤️ using modern web technologies**
