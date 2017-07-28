var axios = require('axios');

module.exports = function(app, addon) {
  // Root route. This route will serve the `atlassian-connect.json` unless the
  // documentation url inside `atlassian-connect.json` is set
  app.get('/', function(req, res) {
    res.format({
      // If the request content-type is text-html, it will decide which to serve up
      'text/html': function() {
        res.redirect('/atlassian-connect.json');
      },
      // This logic is here to make sure that the `atlassian-connect.json` is always
      // served up when requested by the host
      'application/json': function() {
        res.redirect('/atlassian-connect.json');
      },
    });
  });

  app.post('/update-parent', function(req, res) {
    const issue = req.body.issue.fields;
    if (!issue.issuetype.subtask) return;
    if (!issue.parent) return;
    const parentStatus = issue.parent.fields.status.statusCategory.name;
    if (issue.status === 'Done') return;
    const subtaskStatusId = issue.status.id;
    const parentKey = issue.parent.key;
    const subtaskStatus = issue.status.statusCategory.id;
    axios
      .get(
        `https://jpsamsao:samsao-test@samsao-jira-plugin.atlassian.net/rest/api/2/issue/${parentKey}/transitions`,
      )
      .then(response => {
        console.log(response.data.transitions);
        const rightTransition = response.data.transitions.filter(
          transition => transition.to.id === subtaskStatusId,
        );
        console.log(rightTransition);
        if (rightTransition.length === 0) return;
        const transitionToUpdateTo = rightTransition[0];
        console.log('transition' + transitionToUpdateTo);
        axios.post(
          `https://jpsamsao:samsao-test@samsao-jira-plugin.atlassian.net/rest/api/2/issue/${parentKey}/transitions`,
          { transition: { id: transitionToUpdateTo.id } },
        );
      });
    return axios.post(
      `https://jpsamsao:samsao-test@samsao-jira-plugin.atlassian.net/rest/api/2/issue/${parentKey}/transitions`,
      { transition: { id: 21 } },
    );
  });

  // This is an example route that's used by the default "generalPage" module.
  // Verify that the incoming request is authenticated with Atlassian Connect
  app.get('/hello-world', addon.authenticate(), function(req, res) {
    // Rendering a template is easy; the `render()` method takes two params: name of template
    // and a json object to pass the context in
    res.render('hello-world', {
      title: 'Atlassian Connect',
      //issueId: req.query['issueId']
    });
  });

  // Add any additional route handlers you need for views or REST resources here...

  // load any additional files you have in routes and apply those to the app
  {
    var fs = require('fs');
    var path = require('path');
    var files = fs.readdirSync('routes');
    for (var index in files) {
      var file = files[index];
      if (file === 'index.js') continue;
      // skip non-javascript files
      if (path.extname(file) != '.js') continue;

      var routes = require('./' + path.basename(file));

      if (typeof routes === 'function') {
        routes(app, addon);
      }
    }
  }
};
