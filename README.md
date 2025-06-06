
# Zed Sieve Extension

A comprehensive Language Server Protocol extension for [Zed](https://zed.dev) that provides intelligent editing support for the Sieve email filtering language (RFC 5228) with enhanced support for Proton Mail's advanced features.

## Repo structure

```
zed-sieve/
├── extension.toml             # Zed extension configuration
├── src/                       # Extension source code
│   └── extension.rs           # Main extension implementation
├── server/                    # Language server implementation
│   ├── src/
│   │   └── server.ts          # LSP server
│   ├── package.json
│   ├── tsconfig.json
│   └── build/                 # Built server files
├── languages/                 # Language configuration
│   └── sieve/
│       └── config.toml        # Language-specific settings
├── docs/                      # Documentation
│   ├── installation.md
│   ├── configuration.md
│   └── features.md
├── examples/                  # Example configurations
│   └── settings.json
├── .github/                   # CI/CD workflows
│   └── workflows/
│       ├── ci.yml
│       ├── release.yml
│       └── test.yml
├── Cargo.toml                 # Rust extension config
├── README.md
├── LICENSE
└── .gitignore
```
## Features

### files

- tsconfig.json - TypeScript configuration
- README.md - Installation and usage instructions
- package.json - Node.js package configuration for language server
- server/src/server.ts - Language Server implementation
- src/highlights.scm - Syntax highlighting queries
- grammar.js - Tree-sitter grammar for Sieve language
- src/extension.rs - Main extension implementation for Zed
- Zed Sieve Extension - Complete implementation for RFC 5228 + Proton

### ✨ Language Support
- **Complete RFC 5228 compliance** - Full support for the Sieve base specification
- **Proton Mail extensions** - Advanced features like `expire`, `currentdate`, and more
- **Tree-sitter grammar** - Precise syntax highlighting and code structure
- **Language Server Protocol** - Rich editing experience with diagnostics, completion, and hover info

### 🎯 Editor Features
- **Syntax Highlighting** - Beautiful, accurate highlighting for all Sieve constructs
- **Code Completion** - Smart completions for tests, actions, tags, and extensions
- **Error Diagnostics** - Real-time syntax error detection and reporting
- **Hover Documentation** - Inline help for Sieve commands and extensions
- **Auto-formatting** - Consistent code style and indentation
- **Comment Support** - Both line (`#`) and block (`/* */`) comments

### 🚀 Sieve Language Coverage
- **Core Tests**: `address`, `allof`, `anyof`, `envelope`, `exists`, `header`, `not`, `size`, `true`, `false`
- **Core Actions**: `discard`, `fileinto`, `keep`, `redirect`, `reject`, `stop`
- **Extensions**: `body`, `copy`, `date`, `regex`, `vacation`, `variables`, `relational`, and more
- **Proton Features**: `expire`, `currentdate`, advanced date operations, custom filters

## Installation

### Prerequisites
- [Zed editor](https://zed.dev) (latest version)
- [Node.js](https://nodejs.org) v16+ (for language server)
- [Rust](https://rustup.rs/) (for extension compilation)

### Install via Zed Extensions
1. Open Zed
2. Press `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Linux/Windows)
3. Type "Extensions" and select "Extensions: Install Extension"
4. Search for "Sieve" and install

### Manual Installation
1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/zed-sieve
   cd zed-sieve
   ```

2. Build the language server:
   ```bash
   cd server
   npm install
   npm run build
   ```

3. Install the extension in Zed:
   ```bash
   # Copy extension to Zed extensions directory
   cp -r . ~/.config/zed/extensions/sieve
   ```

4. Restart Zed

## Usage

### File Types
The extension automatically activates for files with these extensions:
- `.sieve` - Standard Sieve scripts
- `.sv` - Alternative Sieve extension



### Language Server Features

#### Code Completion
- Type any Sieve command to see available completions
- Trigger with `:` for tag completions
- Context-aware suggestions based on cursor position

#### Error Detection
- Real-time syntax validation
- Missing semicolon detection
- Invalid command highlighting
- Extension requirement checking

#### Hover Help
Hover over any Sieve command to see:
- Command description
- Parameter information
- Usage examples
- Extension requirements

## Configuration

### Extension Options
- `protonExtensions`: Enable Proton Mail specific features (default: true)
- `strictMode`: Enforce RFC 5228 compliance only (default: false)

## Development

### Building from Source
1. Install dependencies:
   ```bash
   # Extension (Rust)
   cargo build --release

   # Language Server (Node.js)
   cd server
   npm install
   npm run build
   ```

2. Run tests:
   ```bash
   # Language server tests
   cd server
   npm test
   ```

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## RFC 5228 Compliance

This extension implements the complete Sieve specification:
- ✅ Base language (RFC 5228)
- ✅ Body extension (RFC 5173)
- ✅ Copy extension (RFC 3894)
- ✅ Date extension (RFC 5260)
- ✅ Environment extension (RFC 5183)
- ✅ Regex extension (draft-ietf-sieve-regex)
- ✅ Variables extension (RFC 5229)
- ✅ Vacation extension (RFC 5230)
- ✅ Relational extension (RFC 5231)

### Proton Mail Extensions
Additional support for Proton's advanced features:
- `expire` action for message expiration
- `currentdate` test for time-based filtering
- Enhanced date/time operations
- Custom flag management

## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/zed-sieve/issues)
- **Documentation**: [Sieve RFC 5228](https://datatracker.ietf.org/doc/html/rfc5228)
- **Proton Help**: [Proton Sieve Documentation](https://proton.me/support/sieve-advanced-custom-filters)

---

Built with ❤️ for the Zed editor community
