
; Keywords
(require_statement "require" @keyword)
(if_statement "if" @conditional)
(elsif_clause "elsif" @conditional)
(else_clause "else" @conditional)

; Boolean operators
(boolean_test "allof" @operator)
(boolean_test "anyof" @operator)
(boolean_test "not" @operator)

; Test commands
(test_name) @function

; Action commands
(action_name) @function.builtin

; Tagged arguments
(tagged_argument ":" @punctuation.delimiter)
(tag_name) @parameter

; Strings
(string) @string
(multiline_string) @string

; Numbers
(number) @number

; Comments
(comment) @comment

; Punctuation
";" @punctuation.delimiter
"," @punctuation.delimiter
"(" @punctuation.bracket
")" @punctuation.bracket
"{" @punctuation.bracket
"}" @punctuation.bracket
"[" @punctuation.bracket
"]" @punctuation.bracket

; Identifiers
(identifier) @variable
