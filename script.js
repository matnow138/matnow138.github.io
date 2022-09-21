$(document).ready(function () {
    const apiRoot = 'https://mateusz-crud.herokuapp.com/v1/tasks';
    const trelloApiRoot = 'https://api.trello.com/1/members/mateuszpnowak';
    const datatableRowTemplate = $('[data-datatablerow-template]').children()[0];
    const $tasksContainer = $('[data-taskscontainer]');
    var availableBoards = {};
    var availableTasks = {};
// init
    getAllTasks();

    function getAllAvailableBoards(callback,
                                   callbackArgs) {
        var requestUrl = trelloApiRoot + '/boards?key=49c54ec8c99ac758df4e4b97cc6000c7&token=fd00d814c2187b7184318152568aa5879c9b394649d4471573d07dcfda094a75';
        $.ajax({
            url: requestUrl,
            method: 'GET',
            contentType: 'application/json',
            success: function (boards) {
                callback(callbackArgs, boards);
            }
        });
    }

    function createElement(data) {
        const element =
            $(datatableRowTemplate).clone();
        element.attr('data-task-id', data.id);
        element.find('[data-task-name-section] [datatask-name-paragraph]').text(data.title);
        element.find('[data-task-name-section] [datatask-name-input]').val(data.title);
        element.find('[data-task-content-section][data-task-content-paragraph]').text(data.content);
        element.find('[data-task-content-section][data-task-content-input]').val(data.content);
        return element;
    }

    function
    prepareBoardOrListSelectOptions(availableChoices) {
        return availableChoices.map(function (choice) {
            return $('<option>')
                .addClass('crud-select__option')
                .val(choice.id)
                .text(choice.name || 'Unknown name');
        });
    }

    function handleDatatableRender(taskData, boards) {
        $tasksContainer.empty();
        boards.forEach(board => {
            availableBoards[board.id] = board;
        });
        taskData.forEach(function (task) {
            var $datatableRowEl = createElement(task);
            var $availableBoardsOptionElements =
                prepareBoardOrListSelectOptions(boards);
            $datatableRowEl.find('[data-board-nameselect]')
                .append($availableBoardsOptionElements);
            $datatableRowEl
                .appendTo($tasksContainer);
        });
    }

    function getAllTasks() {
        const requestUrl = apiRoot;
        $.ajax({
            url: requestUrl,
            method: 'GET',
            contentType: "application/json",
            success: function (tasks) {
                tasks.forEach(task => {
                    availableTasks[task.id] = task;
                });
                getAllAvailableBoards(handleDatatableRender,
                    tasks);
            }
        });
    }

    function handleTaskUpdateRequest() {
        var parentEl = $(this).parents('[data-taskid]');
        var taskId = parentEl.attr('data-task-id');
        var taskTitle = parentEl.find('[data-task-nameinput]').val();
        var taskContent = parentEl.find('[data-taskcontent-input]').val();
        var requestUrl = apiRoot;
        $.ajax({
            url: requestUrl,
            method: "PUT",
            processData: false,
            contentType: "application/json;charset=utf-8",
            dataType: 'json',
            data: JSON.stringify({
                id: taskId,
                title: taskTitle,
                content: taskContent
            }),
            success: function (data) {
                parentEl.attr('data-task-id',
                    data.id).toggleClass('datatable__row--editing');
                parentEl.find('[data-task-nameparagraph]').text(taskTitle);
                parentEl.find('[data-task-contentparagraph]').text(taskContent);
            }
        });
    }

    function handleTaskDeleteRequest() {
        var parentEl = $(this).parents('[data-taskid]');
        var taskId = parentEl.attr('data-task-id');
        var requestUrl = apiRoot;
        $.ajax({
            url: requestUrl + '/' + taskId,
            method: 'DELETE',
            success: function () {
                parentEl.slideUp(400, function () {
                    parentEl.remove();
                });
            }
        })
    }

    function handleTaskSubmitRequest(event) {
        event.preventDefault();
        var taskTitle =
            $(this).find('[name="title"]').val();
        var taskContent =
            $(this).find('[name="content"]').val();
        var requestUrl = apiRoot;
        $.ajax({
            url: requestUrl,
            method: 'POST',
            processData: false,
            contentType: "application/json;charset=utf-8",
            dataType: 'json',
            data: JSON.stringify({
                title: taskTitle,
                content: taskContent
            }),
            complete: function (data) {
                if (data.status === 200) {
                    getAllTasks();
                }
            }
        });
    }

    function toggleEditingState() {
        var parentEl = $(this).parents('[data-taskid]');
        parentEl.toggleClass('datatable__row--editing');
        var taskTitle = parentEl.find('[data-task-nameparagraph]').text();
        var taskContent = parentEl.find('[data-taskcontent-paragraph]').text();
        parentEl.find('[data-task-nameinput]').val(taskTitle);
        parentEl.find('[data-task-contentinput]').val(taskContent);
    }

    function handleBoardNameSelect(event) {
        var $changedSelectEl = $(event.target);
        var selectedBoardId = $changedSelectEl.val();
        var $listNameSelectEl =
            $changedSelectEl.siblings('[data-list-nameselect]');
        var preparedListOptions =
            prepareBoardOrListSelectOptions(availableBoards[selectedBoardId$listNameSelectEl])
                .empty()
                .append(preparedListOptions)
    }

    function handleCardCreationRequest(event) {
        var requestUrl = trelloApiRoot + '/cards';
        var $relatedTaskRow =
            $(event.target).parents('[data-task-id]');
        var relatedTaskId = $relatedTaskRow.attr('datatask-id');
        var relatedTask =
            availableTasks[relatedTaskId];
        var selectedListId =
            $relatedTaskRow.find('[data-list-nameselect]').val();
        if (!selectedListId) {
            alert('You have to select a board and a list first!');
            return;
        }
        $.ajax({
            url: requestUrl,
            method: 'POST',
            processData: false,
            contentType: "application/json;charset=utf-8",
            dataType: 'json',
            data: JSON.stringify({
                name: relatedTask.title,
                description: relatedTask.content,
                listId: selectedListId
            }),
            success: function (data) {
                console.log('Card created - ' +
                    data.shortUrl);
                alert('Card created - ' + data.shortUrl);
            }
        });
    }

    $('[data-task-add-form]').on('submit', handleTaskSubmitRequest);
    $tasksContainer.on('change', '[data-board-nameselect]',
        handleBoardNameSelect);
    $tasksContainer.on('click', '[data-trello-cardcreation-trigger]', handleCardCreationRequest);
    $tasksContainer.on('click', '[data-task-editbutton]',
        toggleEditingState);
    $tasksContainer.on('click', '[data-task-editabort-button]', toggleEditingState);
    $tasksContainer.on('click', '[data-task-submitupdate-button]', handleTaskUpdateRequest);
    $tasksContainer.on('click', '[data-task-deletebutton]',
        handleTaskDeleteRequest);
});
