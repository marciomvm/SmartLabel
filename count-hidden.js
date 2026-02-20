const fs = require('fs');
fetch("https://wjixkrgakcjxtvhczwyf.supabase.co/rest/v1/mush_batches?select=status,id", {
    headers: {
        "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqaXhrcmdha2NqeHR2aGN6d3lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwOTUyODIsImV4cCI6MjA4MjY3MTI4Mn0.ScYZZ5DblF35n-_ZnL91gCisQgqO277mtjRk969d5VA",
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqaXhrcmdha2NqeHR2aGN6d3lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwOTUyODIsImV4cCI6MjA4MjY3MTI4Mn0.ScYZZ5DblF35n-_ZnL91gCisQgqO277mtjRk969d5VA"
    }
}).then(res => res.json()).then(data => {
    let totals = data.length;
    let sold = data.filter(d => d.status === 'SOLD').length;
    let archived = data.filter(d => d.status === 'ARCHIVED').length;
    console.log(`Total: ${totals}, Sold: ${sold}, Archived: ${archived}, Visible: ${totals - sold - archived}`);
}).catch(e => console.error(e));
