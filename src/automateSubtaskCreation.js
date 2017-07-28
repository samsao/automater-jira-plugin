const unirest = require('unirest');

const BASE_URL = 'https://samsao-jira-plugin.atlassian.net';

module.exports.automateSubtaskCreation = function (requestBody) {
    const { projectID, issueKey, issueType } = getIssueDetails(requestBody)
    createSubtasks(projectID, issueKey, issueType);
}

function getIssueDetails(issue) {
    const projectID = issue.issue.fields.project.id
    const issueKey = issue.issue.key
    const issueType = issue.issue.fields.issuetype.id
    return { projectID, issueKey, issueType }
}

function createSubtasks(projectID, issueKey, issueType) {
    let summaries;
    switch (issueType) {
        /// Story
        case "10001":
            summaries = ['Implementation', 'QA', 'Code Review', 'UI/UX Review'];
            break;
        /// Bug
        case "10004":
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
                id: "10003"
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