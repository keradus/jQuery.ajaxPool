/*
 * jQuery ajaxPool plugin
 *
 * @author Dariusz Rumiński
 * @license MIT
 * @link https://github.com/keradus/jQuery.ajaxPool
 * @version 1.0.0
 */

/*jslint plusplus: true */
/*globals jQuery */

(function ($) {
    "use strict";

    $.ajaxPool = function (q) {
        var i, limit, processNextTask, promise, task, taskAbort, taskProcess, tasks, tasksLength;

        processNextTask = function () {
            if (tasks.length) {
                tasks.shift().taskProcess();
            }
        };

        taskProcess = function () {
            var callbacks;

            callbacks = {
                done: this.taskOpts.success,
                fail: this.taskOpts.error,
                always: this.taskOpts.complete
            };
            this.taskOpts.success = this.taskOpts.error = this.taskOpts.complete = undefined;

            this.taskAjax = $.ajax(this.taskOpts).done(callbacks.done).fail(callbacks.fail).always(callbacks.always);
            this.taskAjax.then(this.resolve, this.reject);
        };

        taskAbort = function () {
            if (this.taskAjax) {
                this.taskAjax.abort();
            }
        };

        tasks = [];
        tasksLength = q.tasks.length;
        for (i = 0; i < tasksLength; ++i) {
            task = new $.Deferred();
            task.taskId = i;
            task.taskOpts = q.tasks[i];
            task.taskProcess = taskProcess;
            task.taskAjax = null;
            task.taskAbort = taskAbort;
            task.always(processNextTask);

            tasks[i] = task;
        }

        promise = $.when.apply(this, tasks);

        if (q.success) {
            promise.done(q.success);
        }
        if (q.error) {
            promise.fail(q.error);
        }
        if (q.complete) {
            promise.always(q.complete);
        }

        limit = Math.min(q.limit, tasksLength);
        for (i = 0; i < limit; ++i) {
            processNextTask();
        }

        return promise;
    };
}(jQuery));