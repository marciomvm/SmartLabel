const fs = require('fs');
fetch("https://wjixkrgakcjxtvhczwyf.supabase.co/rest/v1/?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqaXhrcmdha2NqeHR2aGN6d3lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwOTUyODIsImV4cCI6MjA4MjY3MTI4Mn0.ScYZZ5DblF35n-_ZnL91gCisQgqO277mtjRk969d5VA", {
    headers: {
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqaXhrcmdha2NqeHR2aGN6d3lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwOTUyODIsImV4cCI6MjA4MjY3MTI4Mn0.ScYZZ5DblF35n-_ZnL91gCisQgqO277mtjRk969d5VA"
    }
}).then(res => res.json()).then(data => {
    fs.writeFileSync('C:\\Users\\Marcio\\Labels\\schema.json', JSON.stringify(data.definitions.mush_batches, null, 2));
}).catch(e => console.error(e));
