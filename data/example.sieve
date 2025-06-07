# Proton Mail advanced Sieve filter
require ["fileinto", "reject", "copy", "regex", "relational", "comparator-i;ascii-numeric"];

# Reject large messages
if size :over 10M {
    reject "Message too large. Please use a file sharing service.";
}

# Archive newsletters with expiration
if anyof (
    header :contains "from" "newsletter@",
    header :contains "list-unsubscribe" ""
) {
    fileinto :copy "Newsletter";
    expire "day" "30";
}

# Priority inbox for important domains
if address :domain :is "from" ["company.com", "client.com"] {
    fileinto "Priority";
s}

# Spam filtering with regex
if header :regex "subject" "\\b(viagra|lottery|prince)\\b" {
    fileinto "Spam";
    stop;
}

# Time-based filtering (Proton extension)
if currentdate :zone "UTC" :value "lt" "hour" "09" {
    fileinto "After Hours";
}
