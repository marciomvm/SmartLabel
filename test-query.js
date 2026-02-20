const fs = require('fs');
fetch("https://wjixkrgakcjxtvhczwyf.supabase.co/rest/v1/mush_batches?select=id,readable_id,parent_id,parent:mush_batches!parent_id(readable_id)&limit=20&parent_id=not.is.null", {
    headers: {
        "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqaXhrcmdha2NqeHR2aGN6d3lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwOTUyODIsImV4cCI6MjA4MjY3MTI4Mn0.ScYZZ5DblF35n-_ZnL91gCisQgqO277mtjRk969d5VA",
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqaXhrcmdha2NqeHR2aGN6d3lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwOTUyODIsImV4cCI6MjA4MjY3MTI4Mn0.ScYZZ5DblF35n-_ZnL91gCisQgqO277mtjRk969d5VA"
    }
}).then(res => res.json()).then(data => {
    fs.writeFileSync('C:\\Users\\Marcio\\Labels\\test-output.json', JSON.stringify(data, null, 2));
}).catch(e => console.error(e));
