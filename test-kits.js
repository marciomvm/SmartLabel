const fs = require('fs');

const date = new Date();
const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();

fetch(`https://wjixkrgakcjxtvhczwyf.supabase.co/rest/v1/mush_batches?select=id,created_at,type,parent:parent_id(type)&type=eq.SUBSTRATE&created_at=gte.${firstDay}`, {
    headers: {
        "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqaXhrcmdha2NqeHR2aGN6d3lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwOTUyODIsImV4cCI6MjA4MjY3MTI4Mn0.ScYZZ5DblF35n-_ZnL91gCisQgqO277mtjRk969d5VA",
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqaXhrcmdha2NqeHR2aGN6d3lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwOTUyODIsImV4cCI6MjA4MjY3MTI4Mn0.ScYZZ5DblF35n-_ZnL91gCisQgqO277mtjRk969d5VA"
    }
}).then(res => res.json()).then(data => {
    console.log(JSON.stringify(data[0], null, 2));
    let inoculated = data.filter(d => d.parent && d.parent.type === 'GRAIN').length;
    console.log(`\nTotal SUBSTRATE this month: ${data.length}`);
    console.log(`Substrates with GRAIN parent: ${inoculated}`);
}).catch(e => console.error(e));
