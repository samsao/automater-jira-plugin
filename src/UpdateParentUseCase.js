var axios = require('axios');

const BASE_URL = 'https://samsao-jira-plugin.atlassian.net';

module.exports.UpdateParentUseCase = function(request) {
  updateParent(request);
};

function updateParent(request) {
  const issue = request.body.issue.fields;
  if (!issue.issuetype.subtask) return;
  if (!issue.parent) return;
  if (issue.status === 'Done') return;
  const subtaskStatusId = issue.status.id;
  const parentKey = issue.parent.key;

  getTransitionList(parentKey, subtaskStatusId).then(response => {
    const rightTransition = response.data.transitions.filter(
      transition => transition.to.id === subtaskStatusId
    );
    if (rightTransition.length === 0) return;
    const transitionToUpdateTo = rightTransition[0];
    updateParentStatus(parentKey, transitionToUpdateTo.id);
  });
}

function getTransitionList(parentKey, subtaskStatusId) {
  return axios.get(
    `https://jpsamsao:samsao-test@samsao-jira-plugin.atlassian.net/rest/api/2/issue/${parentKey}/transitions`
  );
}

function updateParentStatus(parentKey, transitionId) {
  axios.post(
    `https://jpsamsao:samsao-test@samsao-jira-plugin.atlassian.net/rest/api/2/issue/${parentKey}/transitions`,
    { transition: { id: transitionId } }
  );
}
