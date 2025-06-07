import {
    createConnection,
    TextDocuments,
    Diagnostic,
    DiagnosticSeverity,
    ProposedFeatures,
    InitializeParams,
    DidChangeConfigurationNotification,
    CompletionItem,
    CompletionItemKind,
    TextDocumentPositionParams,
    TextDocumentSyncKind,
    InitializeResult,
    DocumentDiagnosticReportKind,
    type DocumentDiagnosticReport,
    Hover,
    MarkupKind,
} from "vscode-languageserver/node";

import { TextDocument } from "vscode-languageserver-textdocument";

// Create a connection for the server
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;

connection.onInitialize((params: InitializeParams) => {
    const capabilities = params.capabilities;

    hasConfigurationCapability = !!(
        capabilities.workspace && !!capabilities.workspace.configuration
    );
    hasWorkspaceFolderCapability = !!(
        capabilities.workspace && !!capabilities.workspace.workspaceFolders
    );
    hasDiagnosticRelatedInformationCapability = !!(
        capabilities.textDocument &&
        capabilities.textDocument.publishDiagnostics &&
        capabilities.textDocument.publishDiagnostics.relatedInformation
    );

    const result: InitializeResult = {
        capabilities: {
            textDocumentSync: TextDocumentSyncKind.Incremental,
            completionProvider: {
                resolveProvider: true,
                triggerCharacters: [":"],
            },
            hoverProvider: true,
            diagnosticProvider: {
                interFileDependencies: false,
                workspaceDiagnostics: false,
            },
        },
    };
    if (hasWorkspaceFolderCapability) {
        result.capabilities.workspace = {
            workspaceFolders: {
                supported: true,
            },
        };
    }
    return result;
});

connection.onInitialized(() => {
    if (hasConfigurationCapability) {
        connection.client.register(
            DidChangeConfigurationNotification.type,
            undefined,
        );
    }
    if (hasWorkspaceFolderCapability) {
        connection.workspace.onDidChangeWorkspaceFolders((_event) => {
            connection.console.log("Workspace folder change event received.");
        });
    }
});

// Sieve language completions
const SIEVE_TESTS = [
    "address",
    "allof",
    "anyof",
    "envelope",
    "exists",
    "false",
    "header",
    "not",
    "size",
    "true",
    "body",
    "currentdate",
    "date",
    "environment",
    "mailbox",
    "mailboxexists",
    "regex",
    "spamtest",
    "virustest",
];

const SIEVE_ACTIONS = [
    "discard",
    "fileinto",
    "keep",
    "redirect",
    "reject",
    "stop",
    "addflag",
    "removeflag",
    "setflag",
    "vacation",
    "notify",
    "denotify",
    "expire",
];

const SIEVE_TAGS = [
    ":is",
    ":contains",
    ":matches",
    ":regex",
    ":count",
    ":value",
    ":comparator",
    ":localpart",
    ":domain",
    ":all",
    ":over",
    ":under",
    ":copy",
    ":zone",
    ":originalzone",
    ":create",
    ":flags",
    ":importance",
    ":mime",
    ":anychild",
    ":type",
    ":subtype",
    ":contenttype",
    ":param",
];

const SIEVE_EXTENSIONS = [
    "body",
    "copy",
    "date",
    "editheader",
    "encoded-character",
    "envelope",
    "environment",
    "ereject",
    "fileinto",
    "foreverypart",
    "imap4flags",
    "include",
    "index",
    "mailbox",
    "mboxmetadata",
    "mime",
    "regex",
    "reject",
    "relational",
    "servermetadata",
    "spamtest",
    "subaddress",
    "vacation",
    "variables",
    "virustest",
];

connection.onCompletion(
    (_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
        const completions: CompletionItem[] = [];

        // Add test completions
        SIEVE_TESTS.forEach((test) => {
            completions.push({
                label: test,
                kind: CompletionItemKind.Function,
                detail: `Sieve test: ${test}`,
                documentation: getTestDocumentation(test),
            });
        });

        // Add action completions
        SIEVE_ACTIONS.forEach((action) => {
            completions.push({
                label: action,
                kind: CompletionItemKind.Method,
                detail: `Sieve action: ${action}`,
                documentation: getActionDocumentation(action),
            });
        });

        // Add tag completions
        SIEVE_TAGS.forEach((tag) => {
            completions.push({
                label: tag,
                kind: CompletionItemKind.Property,
                detail: `Sieve tag: ${tag}`,
                documentation: getTagDocumentation(tag),
            });
        });

        // Add extension completions for require statements
        SIEVE_EXTENSIONS.forEach((ext) => {
            completions.push({
                label: `"${ext}"`,
                kind: CompletionItemKind.Module,
                detail: `Sieve extension: ${ext}`,
                documentation: getExtensionDocumentation(ext),
            });
        });

        return completions;
    },
);

connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
    return item;
});

connection.onHover(({ textDocument, position }): Hover | null => {
    const document = documents.get(textDocument.uri);
    if (!document) return null;

    const text = document.getText();
    const offset = document.offsetAt(position);
    const word = getWordAtPosition(text, offset);

    if (!word) return null;

    const documentation = getHoverDocumentation(word);
    if (!documentation) return null;

    return {
        contents: {
            kind: MarkupKind.Markdown,
            value: documentation,
        },
    };
});

// Diagnostic support
connection.languages.onDocumentDiagnostic(
    ({ textDocument }): DocumentDiagnosticReport => {
        const document = documents.get(textDocument.uri);
        const diagnostics: Diagnostic[] = [];

        if (document) {
            const text = document.getText();
            const lines = text.split("\n");

            lines.forEach((line, index) => {
                // Check for basic syntax errors
                if (line.trim().endsWith(";") && !isValidSieveStatement(line)) {
                    diagnostics.push({
                        severity: DiagnosticSeverity.Error,
                        range: {
                            start: { line: index, character: 0 },
                            end: { line: index, character: line.length },
                        },
                        message: "Invalid Sieve statement syntax",
                        source: "sieve-lsp",
                    });
                }

                // Check for missing semicolons on action statements
                if (isActionLine(line) && !line.trim().endsWith(";")) {
                    diagnostics.push({
                        severity: DiagnosticSeverity.Error,
                        range: {
                            start: { line: index, character: line.length - 1 },
                            end: { line: index, character: line.length },
                        },
                        message: "Missing semicolon after action statement",
                        source: "sieve-lsp",
                    });
                }
            });
        }

        return {
            kind: DocumentDiagnosticReportKind.Full,
            items: diagnostics,
        };
    },
);

// Helper functions
function getWordAtPosition(text: string, offset: number): string | null {
    const before = text.slice(0, offset);
    const after = text.slice(offset);
    const wordBefore = before.match(/[\w:]+$/)?.[0] || "";
    const wordAfter = after.match(/^[\w:]*/)?.[0] || "";
    const word = wordBefore + wordAfter;
    return word.length > 0 ? word : null;
}

function isValidSieveStatement(line: string): boolean {
    const trimmed = line.trim();
    if (trimmed.startsWith("#") || trimmed === "") return true;

    // Basic validation - check if it contains known keywords
    return (
        SIEVE_TESTS.some((test) => trimmed.includes(test)) ||
        SIEVE_ACTIONS.some((action) => trimmed.includes(action)) ||
        trimmed.startsWith("require") ||
        trimmed.startsWith("if") ||
        trimmed.startsWith("elsif") ||
        trimmed.startsWith("else")
    );
}

function isActionLine(line: string): boolean {
    const trimmed = line.trim();
    return SIEVE_ACTIONS.some((action) => trimmed.startsWith(action));
}

function getTestDocumentation(test: string): string {
    const docs: Record<string, string> = {
        address: "Tests email addresses in headers like From, To, Cc",
        allof: "Logical AND - all tests must be true",
        anyof: "Logical OR - any test can be true",
        envelope: "Tests SMTP envelope information",
        exists: "Tests if a header exists",
        header: "Tests header values",
        size: "Tests message size",
        currentdate: "Tests current date/time (Proton extension)",
        body: "Tests message body content",
        regex: "Regular expression matching",
    };
    return docs[test] || "Sieve test command";
}

function getActionDocumentation(action: string): string {
    const docs: Record<string, string> = {
        fileinto: "File message into specified folder",
        redirect: "Redirect message to another address",
        reject: "Reject message with error",
        discard: "Silently discard message",
        keep: "Keep message in inbox",
        stop: "Stop processing script",
        vacation: "Send auto-reply message",
        expire: "Set message expiration (Proton extension)",
    };
    return docs[action] || "Sieve action command";
}

function getTagDocumentation(tag: string): string {
    const docs: Record<string, string> = {
        ":is": "Exact string match",
        ":contains": "Substring match",
        ":matches": "Wildcard pattern match",
        ":regex": "Regular expression match",
        ":over": "Size comparison (greater than)",
        ":under": "Size comparison (less than)",
        ":copy": "Copy message instead of moving",
        ":zone": "Specify timezone for date operations",
    };
    return docs[tag] || "Sieve tag parameter";
}

function getExtensionDocumentation(ext: string): string {
    const docs: Record<string, string> = {
        regex: "Regular expression support",
        body: "Message body testing",
        vacation: "Auto-reply functionality",
        fileinto: "File into folders",
        copy: "Copy instead of move",
        variables: "Variable support",
        date: "Date/time operations",
        relational: "Numeric comparisons",
    };
    return docs[ext] || "Sieve extension";
}

function getHoverDocumentation(word: string): string | null {
    if (SIEVE_TESTS.includes(word)) {
        return `**${word}** - ${getTestDocumentation(word)}`;
    }
    if (SIEVE_ACTIONS.includes(word)) {
        return `**${word}** - ${getActionDocumentation(word)}`;
    }
    if (SIEVE_TAGS.includes(word)) {
        return `**${word}** - ${getTagDocumentation(word)}`;
    }
    return null;
}

// Make the text document manager listen on the connection
documents.listen(connection);

// Listen on the connection
connection.listen();
