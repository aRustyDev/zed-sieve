# Zed Extensions
# Language Tooling Architecture: Tree-sitter vs Language Server

## 🏗️ **The Two-Layer Architecture**

Modern code editors like Zed use **two complementary technologies** that work together but serve different purposes:

```
┌─────────────────────────────────────────────────────────────┐
│                        ZED EDITOR                           │
├─────────────────────────────────────────────────────────────┤
│  PRESENTATION LAYER (What you see)                         │
│  • Syntax highlighting                                     │
│  • Code folding                                           │
│  • Bracket matching                                       │
│  • Text objects                                           │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │ parsing
                              │
┌─────────────────────────────────────────────────────────────┐
│                     TREE-SITTER                            │
│  SYNTAX LAYER (Fast, local parsing)                        │
│  • Parses code into Abstract Syntax Tree (AST)             │
│  • Provides syntax highlighting queries                    │
│  • Enables structural navigation                           │
│  • Works offline, no network needed                        │
│  • Updates incrementally as you type                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  LANGUAGE SERVER                           │
│  SEMANTIC LAYER (Smart, language-aware)                    │
│  • Understands language semantics                          │
│  • Provides completions, hover docs, diagnostics           │
│  • Cross-file analysis                                     │
│  • Can be remote, connects via JSON-RPC                    │
│  • Maintains project-wide state                            │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │ Language Server Protocol (LSP)
                              │
┌─────────────────────────────────────────────────────────────┐
│                        ZED EDITOR                           │
├─────────────────────────────────────────────────────────────┤
│  INTELLIGENCE LAYER (What you interact with)               │
│  • Autocompletion                                         │
│  • Error diagnostics                                      │
│  • Hover documentation                                    │
│  • Go-to-definition                                       │
│  • Refactoring                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🌳 **Tree-sitter: The Syntax Layer**

### **What Tree-sitter Does:**
- **Parses code structure** - Converts text into an Abstract Syntax Tree (AST)
- **Syntax highlighting** - Uses `.scm` query files to colorize code
- **Fast incremental parsing** - Updates only changed parts when you edit
- **Structural navigation** - Powers bracket matching, code folding, text objects

### **What Tree-sitter Does NOT Do:**
- ❌ Language semantics (doesn't understand what code means)
- ❌ Error detection (only syntax errors from parsing failures)
- ❌ Autocompletion suggestions
- ❌ Cross-file analysis
- ❌ Type checking

### **Tree-sitter Example:**
```sieve
require "fileinto";
if header :contains "from" "boss" {
    fileinto "Important";
}
```

Tree-sitter parses this into an AST:
```
(source_file
  (require_statement
    (string "fileinto"))
  (if_statement
    (test_command
      (test_name "header")
      (tagged_argument ":" "contains")
      (string "from")
      (string "boss"))
    (block
      (action_statement
        (action_command
          (action_name "fileinto")
          (string "Important"))))))
```

Then `highlights.scm` maps nodes to colors:
```scheme
(test_name) @function          ; "header" gets function color
(action_name) @function.builtin ; "fileinto" gets builtin color
(string) @string               ; All strings get string color
```

---

## 🚀 **Language Server: The Intelligence Layer**

### **What Language Server Does:**
- **Semantic analysis** - Understands what code means, not just structure
- **Cross-file awareness** - Knows about imports, dependencies, project structure
- **Real-time diagnostics** - Finds semantic errors, not just syntax errors
- **Context-aware completions** - Suggests what's valid at cursor position
- **Documentation on demand** - Provides hover info, parameter hints

### **Language Server Example:**
For the same Sieve code, the LSP provides:
- **Completions**: When you type `:`, suggests `:contains`, `:is`, `:matches`
- **Diagnostics**: If you forget `require "fileinto"`, shows error
- **Hover docs**: When you hover over `fileinto`, shows "Files message into specified mailbox"

---

## 🔍 **How Autocompletion Works**

### **The LSP Completion Flow:**

```
1. USER TYPES              2. ZED SENDS REQUEST       3. LSP ANALYZES
┌─────────────┐            ┌─────────────────────┐    ┌──────────────────┐
│ if header : │  ────────► │ textDocument/       │───►│ • Parse context  │
│            ▌│            │ completion          │    │ • Check cursor   │
│ (cursor)    │            │                     │    │ • Find valid     │
└─────────────┘            │ Position: line 1,   │    │   completions    │
                           │ character 11        │    └──────────────────┘
                           └─────────────────────┘                │
                                                                  ▼
4. LSP RETURNS SUGGESTIONS                   5. ZED SHOWS COMPLETIONS
┌────────────────────────────────────┐      ┌─────────────────────────┐
│ CompletionList: [                  │ ◄────│ :contains               │
│   {                                │      │ :is                     │
│     label: ":contains",            │      │ :matches                │
│     kind: Property,                │      │ :regex                  │
│     detail: "Substring match",     │      │ ────────────────────────│
│     documentation: "Tests if..."   │      │ Documentation preview   │
│   },                               │      └─────────────────────────┘
│   { label: ":is", ... },          │
│   { label: ":matches", ... }      │
│ ]                                  │
└────────────────────────────────────┘
```

### **How LSP Creates Suggestions:**

1. **Context Analysis**: LSP examines the cursor position and surrounding code
2. **Scope Resolution**: Determines what's valid at this location (tests, actions, tags)
3. **Extension Awareness**: Only suggests features from required extensions
4. **Semantic Filtering**: Filters based on language rules (e.g., `:copy` only on actions)

```rust
// In your Rust LSP implementation:
async fn completion(&self, params: CompletionParams) -> Result<Option<CompletionResponse>> {
    let document = self.get_document(&params.text_document.uri);
    let position = params.position;

    // Analyze what's being typed
    let context = self.analyze_completion_context(document, position);

    match context {
        CompletionContext::AfterColon => {
            // User typed ":", suggest tags like :contains, :is
            self.get_tag_completions()
        },
        CompletionContext::TestPosition => {
            // User is in test position, suggest test commands
            self.get_test_completions()
        },
        CompletionContext::ActionPosition => {
            // User is in action position, suggest actions
            self.get_action_completions()
        }
    }
}
```

---

## 📖 **How Hover Documentation Works**

### **The LSP Hover Flow:**

```
1. USER HOVERS           2. ZED SENDS REQUEST       3. LSP LOOKS UP INFO
┌─────────────┐         ┌─────────────────────┐    ┌──────────────────┐
│ fileinto    │ ──────► │ textDocument/hover  │───►│ • Identify word  │
│     ▲       │         │                     │    │ • Check if known │
│  (hover)    │         │ Position: line 2,   │    │ • Get docs from  │
└─────────────┘         │ character 4         │    │   knowledge base │
                        └─────────────────────┘    └──────────────────┘
                                                            │
                                                            ▼
4. LSP RETURNS DOCUMENTATION            5. ZED SHOWS HOVER POPUP
┌─────────────────────────────────┐    ┌──────────────────────────────┐
│ Hover: {                        │◄───│ ┌──────────────────────────┐ │
│   contents: {                   │    │ │ fileinto                 │ │
│     kind: "markdown",           │    │ │ ──────────────────────── │ │
│     value: "**fileinto**\n\n    │    │ │ Files the message into   │ │
│     Files the message into the  │    │ │ the specified mailbox.   │ │
│     specified mailbox.\n\n      │    │ │                          │ │
│     Usage: `fileinto \"folder\"`│    │ │ Usage: fileinto "folder" │ │
│   }                             │    │ └──────────────────────────┘ │
│ }                               │    └──────────────────────────────┘
└─────────────────────────────────┘
```

### **How LSP Provides Documentation:**

```rust
async fn hover(&self, params: HoverParams) -> Result<Option<Hover>> {
    let word = self.get_word_at_position(params.position);

    let documentation = match word.as_str() {
        "fileinto" => "**fileinto**\n\nFiles the message into the specified mailbox.\n\nUsage: `fileinto \"folder\"`",
        "header" => "**header**\n\nTests the contents of specified header fields.\n\nUsage: `header :contains \"from\" \"boss\"`",
        // ... more documentation
    };

    Ok(Some(Hover {
        contents: HoverContents::Markup(MarkupContent {
            kind: MarkupKind::Markdown,
            value: documentation.to_string(),
        }),
        range: None,
    }))
}
```

---

## 🚨 **How Error Detection Works**

### **Two Types of Error Detection:**

#### **1. Syntax Errors (Tree-sitter)**
- **When**: Code doesn't match grammar rules
- **Example**: Missing semicolon, unmatched brackets
- **Speed**: Instant (as you type)
- **Scope**: Current file only

#### **2. Semantic Errors (Language Server)**
- **When**: Code is syntactically correct but semantically wrong
- **Example**: Using undefined extension, wrong parameter types
- **Speed**: After brief delay (LSP analysis)
- **Scope**: Project-wide

### **The LSP Diagnostic Flow:**

```
1. CODE CHANGE            2. ZED NOTIFIES LSP        3. LSP ANALYZES
┌─────────────┐          ┌─────────────────────┐    ┌──────────────────┐
│ require     │ ───────► │ textDocument/       │───►│ • Validate syntax│
│ if header { │          │ didChange           │    │ • Check semantics│
│ (no semi)   │          │                     │    │ • Find problems  │
└─────────────┘          │ Full document text  │    └──────────────────┘
                         └─────────────────────┘                │
                                                                ▼
4. LSP RETURNS DIAGNOSTICS              5. ZED SHOWS ERRORS
┌──────────────────────────────────┐   ┌─────────────────────────┐
│ PublishDiagnostics: [            │◄──│ require                 │
│   {                              │   │ if header {             │
│     range: {                     │   │          ╰─ ❌ Missing  │
│       start: { line: 1, char: 10} │   │             semicolon  │
│       end: { line: 1, char: 11 }  │   │                         │
│     },                           │   │ Problems (1)            │
│     severity: Error,             │   │ ● Missing semicolon     │
│     message: "Missing semicolon" │   │   after action statement│
│   }                              │   └─────────────────────────┘
│ ]                                │
└──────────────────────────────────┘
```

### **How LSP Detects Errors:**

```rust
async fn validate_document(&self, uri: &Url) -> Vec<Diagnostic> {
    let mut diagnostics = Vec::new();
    let document = self.get_document(uri);
    let text = document.get_text();

    for (line_idx, line) in text.lines().enumerate() {
        // Check for missing semicolons
        if self.is_action_line(line) && !line.trim().ends_with(';') {
            diagnostics.push(Diagnostic {
                range: Range {
                    start: Position { line: line_idx as u32, character: line.len() as u32 },
                    end: Position { line: line_idx as u32, character: line.len() as u32 },
                },
                severity: Some(DiagnosticSeverity::ERROR),
                message: "Missing semicolon after action statement".to_string(),
                // ... more fields
            });
        }

        // Check for undefined extensions
        if line.contains("body") && !self.has_required_extension("body") {
            diagnostics.push(Diagnostic {
                // ... error for missing 'require "body"'
            });
        }
    }

    diagnostics
}
```

---

## 🔄 **How They Work Together**

### **Complementary Responsibilities:**

| Feature | Tree-sitter | Language Server |
|---------|-------------|-----------------|
| **Syntax Highlighting** | ✅ Fast, local | ❌ Too slow |
| **Error Detection** | Basic syntax only | ✅ Semantic errors |
| **Autocompletion** | ❌ No language knowledge | ✅ Context-aware |
| **Hover Documentation** | ❌ No semantic info | ✅ Rich documentation |
| **Code Folding** | ✅ Structure-based | ❌ Overkill |
| **Bracket Matching** | ✅ AST-based | ❌ Too slow |

### **Example: Complete Sieve Experience**

When you open a `.sieve` file in Zed:

1. **Tree-sitter immediately**:
   - Parses code into AST
   - Applies syntax highlighting
   - Enables bracket matching

2. **Language Server shortly after**:
   - Validates Sieve semantics
   - Checks extension requirements
   - Reports diagnostics

3. **When you type `:`**:
   - Tree-sitter updates AST incrementally
   - LSP provides context-aware tag completions

4. **When you hover over `fileinto`**:
   - Tree-sitter identifies the word boundaries
   - LSP provides rich documentation

---

## 🎯 **Key Takeaways**

1. **Tree-sitter = Fast + Local + Syntax**
   - Handles visual presentation
   - Works without network
   - Updates as you type

2. **Language Server = Smart + Semantic + Project-aware**
   - Understands language meaning
   - Provides intelligent features
   - Can analyze entire project

3. **They're complementary, not competing**
   - Tree-sitter for immediate visual feedback
   - LSP for intelligent editing assistance

4. **Both are required for full experience**
   - Tree-sitter alone = pretty but dumb
   - LSP alone = smart but slow/ugly
   - Together = fast, pretty, and intelligent! 🚀

This is why you need both your tree-sitter grammar AND your language server working together to get the complete Sieve editing experience in Zed!
