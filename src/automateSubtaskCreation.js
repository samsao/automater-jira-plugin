const unirest = require('unirest');

const BASE_URL = 'https://samsao-jira-plugin.atlassian.net';

module.exports.automateSubtaskCreation = function (requestBody) {
    const { projectID, issueKey, issueName } = getIssueDetails(requestBody)
    createSubtasks(projectID, issueKey, issueName);
}

function getIssueDetails(issue) {
    const projectID = issue.issue.fields.project.id
    const issueKey = issue.issue.key
    const issueName = issue.issue.fields.issuetype.name
    return { projectID, issueKey, issueName }
}

function createSubtasks(projectID, issueKey, issueName) {
    let summaries;
    switch (issueName.toLowerCase()) {
        case "story":
            summaries = ['Implementation', 'QA', 'Code Review', 'UI/UX Review'];
            break;
        case "bug":
            summaries = ['Fix the bug', 'QA', 'Code Review', 'Client Approval'];
            break;
    }

    updateJiraIssue(projectID, issueKey, summaries);
}

function createBodyForSubTask(projectID, issueKey, summaries) {
    return summaries.map(summary => ({
        fields: {
            parent: {
                key: issueKey
            },
            project: {
                id: projectID
            },
            summary: summary,
            issuetype: {
                name: "Sub-task"
            }
        }
    }));
}

function updateJiraIssue(projectID, issueKey, summaries) {
    const postHeaders = {
        'Authorization': 'Basic anBzYW1zYW86c2Ftc2FvLXRlc3Q=',
        'Content-Type': 'application/json'
    };
    unirest.post(BASE_URL + '/rest/api/2/issue/bulk')
        .headers(postHeaders)
        .send({
            issueUpdates: createBodyForSubTask(projectID, issueKey, summaries)
        })
        .end()
}
