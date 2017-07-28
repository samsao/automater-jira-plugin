const unirest = require('unirest');
module.exports = function (app, addon) {

    const baseURL = 'https://samsao-jira-plugin.atlassian.net';
    const postHeaders = {
        'Authorization': 'Basic anBzYW1zYW86c2Ftc2FvLXRlc3Q=',
        'Content-Type': 'application/json'
    };

    // Root route. This route will serve the `atlassian-connect.json` unless the
    // documentation url inside `atlassian-connect.json` is set
    app.get('/', function (req, res) {
        res.format({
            // If the request content-type is text-html, it will decide which to serve up
            'text/html': function () {
                res.redirect('/atlassian-connect.json');
            },
            // This logic is here to make sure that the `atlassian-connect.json` is always
            // served up when requested by the host
            'application/json': function () {
                res.redirect('/atlassian-connect.json');
            }
        });
    });

    // This is an example route that's used by the default "generalPage" module.
    // Verify that the incoming request is authenticated with Atlassian Connect
    app.get('/hello-world', addon.authenticate(), function (req, res) {
        // Rendering a template is easy; the `render()` method takes two params: name of template
        // and a json object to pass the context in
        res.render('hello-world', {
            title: 'Atlassian Connect'
            //issueId: req.query['issueId']
        });
    }
    );

    app.get('/create-issue', (req, res) => {
        log(req.url);
        res.send();
    });

    app.post('/create-issue', (req, res) => {
        log(req.url);
        log(JSON.stringify(req.body));
        const {projectID, issueKey, issueType} = getIssueDetails(req.body)
        createSubtasks(projectID, issueKey, issueType);
        res.send();
    });

    // Add any additional route handlers you need for views or REST resources here...

    function log(msg) {
        var fs = require('fs')
        var newline = Date() + "\t" + msg + "\n"
        fs.appendFile('public/log', newline, function (err) {
            if (err) throw err;
            console.log('Saved!');
        });
    }

    function getIssueDetails(issue) {
        const projectID = issue.issue.fields.project.id
        const issueKey = issue.issue.key
        const issueType = issue.issue.fields.issuetype.id
        return {projectID, issueKey, issueType}
    }

    function createSubtasks(projectID, issueKey, issueType) {
        let summaries;
        switch(issueType) {
            /// Story
            case "10001": 
                summaries = ['Implementation', 'QA', 'Code Review', 'UI/UX Review'];
            break;
            /// Bug
            case "10004": 
                summaries = ['Fix the bug', 'QA', 'Code Review', 'Client Approval'];
            break;
        }

        /// Send Request
        unirest.post(baseURL + '/rest/api/2/issue/bulk')
        .headers(postHeaders)
        .send({
            issueUpdates: createBodyForSubTask(projectID, issueKey, summaries)
        })
        .end()
    }

    function createBodyForSubTask(projectID, issueKey, summaries) {
        return summaries.map(summary =>({
            fields: {
                parent: {
                    key: issueKey
                },
                project: {
                    id: projectID
                },
                summary: summary,
                issuetype: {
                    id: "10003"
                }
            }
        }));
    }

    // load any additional files you have in routes and apply those to the app
    {
        var fs = require('fs');
        var path = require('path');
        var files = fs.readdirSync("routes");
        for (var index in files) {
            var file = files[index];
            if (file === "index.js") continue;
            // skip non-javascript files
            if (path.extname(file) != ".js") continue;

            var routes = require("./" + path.basename(file));

            if (typeof routes === "function") {
                routes(app, addon);
            }
        }
    }
};
