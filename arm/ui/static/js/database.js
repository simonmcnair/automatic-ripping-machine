/*jshint multistr: true */
/*jshint esversion: 6 */
/*global $:false, jQuery:false */
/* jshint node: true */
/* jshint strict: false */

let hrrref = "";
let activeJob = null;
let actionType = null;
let z = "";

function checkNewUser(seen) {
    if (seen === false) {
        /*have not agreed to understanding the risks, show modal*/
        hrrref = "entryWarn";
        $("div .modal-title").html("<p class=\"text-center text-danger\">WARNING");
        $("div.modal-body").html("<p class=\"text-center bg-danger text-white\">This can be dangerous if you don't know what you're doing. <br>" +
            "You could delete all your of your database entries if you're not careful!!! <br>" +
            "Be careful!<br><br> Are you sure you want to continue ?</p>");
        $(MODEL_ID).modal("show");
        $(DB_SUCCESS_BTN_ID ).addClass("d-none");
        $(DB_FAIL_BTN_ID).addClass("d-none");
        $("#message3").addClass("d-none");
        $("#message1").addClass("d-none");
    }
}


//Simple function to check if we have already agreed
function checkCookie() {
    const understands = getCookie("understands");
    return understands !== "" && understands !== null;
}

//Get only the understands cookie
function getCookie(cname) {
    const name = cname + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(";");
    for (let c of ca) {
        while (c.charAt(0) === " ") {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            // Returns "yes"
            return c.substring(name.length, c.length);
        }
    }
    return null
}

//Set out cookie so we dont need the dialog popping up
function setCookie(cname, cvalue, exdays) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    const expires = `expires=${d.toUTCString()}`;
    document.cookie = `${cname}=${cvalue};${expires};path=/`;
}

function switchDelete() {
    $("#jobId" + activeJob).remove();
    $(MSG_1_ID).html("Job was successfully deleted");
    hideModal();
    setTimeout(
        function () {
            $("#message1").addClass("d-none");
        },
        5000
    );
}

function switchAbandon() {
    $("#status" + activeJob).attr("src", "static/img/fail.png");
    $(MSG_1_ID).html("Job was successfully abandoned");
    hideModal();
    setTimeout(
        function () {
            $("#message1").addClass("d-none");
        },
        5000
    );
}

function switchLogFile(data) {
    $(this).find(MODAL_TITLE).text("Logfile");
    $(MSG_1_ID).html("Here is the logfile you requested");
    $("div .card-deck").html(`<div class="bg-info card-header row no-gutters justify-content-center col-md-12 mx-auto">
                              <strong>${data.job_title}</strong></div><pre class="text-white bg-secondary"><code>${data.log}</code></pre>`);
    window.scrollTo({top: 0, behavior: "smooth"});
    hideModal();
}

function switchSearch(data, addJobItem) {
    $(this).find(MODAL_TITLE).text("searching....");
    $(CARD_DECK).html("");
    const size = Object.keys(data.results).length;
    console.log("length = " + size);
    if (size > 0) {
        $.each(data.results, function (_index, value) {
            z = addJobItem(value);
            $(CARD_DECK).append(z);
        });
        console.log(data);
        $(MSG_1_ID).html("Here are the jobs i found matching your query");
        $("#m-body").addClass("bd-example-modal-lg");
        $("#m-body").modal("handleUpdate");
        $(MODEL_ID).modal("toggle");
        $("#message1").removeClass("d-none").removeClass("alert-danger").addClass(SUCCESS_CLASS);
        $("#message2").addClass("d-none");
        $("#message3").addClass("d-none");
    } else {
        $(MSG_1_ID).html("I couldnt find any results matching that title");
        $("#message1").removeClass("d-none").removeClass(SUCCESS_CLASS).addClass("alert-danger");
        $(MODEL_ID).modal("toggle");
    }
}

function switchFixPerms() {
    $("#jobId" + activeJob).addClass(SUCCESS_CLASS);
    $(MSG_1_ID).html("Permissions fixed");
    hideModal();
    setTimeout(
        function () {
            $("#message1").addClass("d-none");
            },
        5000
    );
}

/**
 * In the event of a failed request warn the user and then hide the
 * messages after a timeout
 */
function processFailedReturn() {
    $("#message3").removeClass("d-none");
    $("#message1").addClass("d-none");
    $("#message2").addClass("d-none");
    $(MODEL_ID).modal("toggle");
    setTimeout(
        function () {
            $("#message3").addClass("d-none");
        },
        5000
    );
}

function proccessReturn(data, addJobItem) {
    if (data.success) {
        switch (data.mode) {
            case "delete":
                switchDelete();
                break;
            case "abandon":
                switchAbandon();
                break;
            case "logfile":
                switchLogFile.call(this, data);
                break;
            case "search":
                switchSearch.call(this, data, addJobItem);
                break;
            case "fixperms":
                switchFixPerms();
                break;
            default:
                $(MODEL_ID).modal("toggle");
                break;
        }
    } else {
        processFailedReturn();
    }
}

function checkHref(addJobItem) {
    if (hrrref !== "") {
        // Add the spinner to let them know we are loading
        $("#m-body").append("<div class=\"d-flex justify-content-center\">" +
            "<div class=\"spinner-border\" role=\"status\"><span class=\"sr-only\">Loading...</span></div></div>");
        if (actionType === "search") {
            console.log("searching");
            console.log("q=" + $(SEARCH_BOX_ID).val());
            hrrref = hrrref + $(SEARCH_BOX_ID).val();
            console.log("href=" + hrrref);
        }
        if (hrrref === "entryWarn") {
            setCookie("understands", "yes", 66);
            $(MODEL_ID).modal("toggle");
            $(DB_SUCCESS_BTN_ID).removeClass("d-none");
            $(DB_FAIL_BTN_ID).removeClass("d-none");
            hrrref = "";
        }
        $.get(hrrref, function (data) {
            console.log(data.success); // John
            console.log("#jobId" + activeJob);
            proccessReturn(data, addJobItem);
        }, "json");
    }
}

/**
 * Function to get jobs (success/fail buttons) from the arm api
 * @param getJobsHREF link to the json api
 */
function fetchJobs(getJobsHREF) {
    // Add the spinner to let them know we are loading
    $(MODEL_ID).modal("show");
    $(MODAL_TITLE).text("Loading...");
    $(".modal-body").html("");
    $(".modal-body").append("<div class=\"d-flex justify-content-center\"><div class=\"spinner-border\" role=\"status\"><span class=\"sr-only\">Loading...</span></div></div>");
    $.get(getJobsHREF, function (data) {
        if (data.success === true) {
            $(CARD_DECK).html("");
            const size = Object.keys(data.results).length;
            if (size > 0) {
                $(MSG_1_ID).html("Here are all the jobs you asked for....");
                $.each(data.results, function (_index, value) {
                    $(CARD_DECK).append(addJobItem(value));
                });
            } else {
                $(MSG_1_ID).html("I couldn't find any results matching that title");
                $("#message1").removeClass("d-none");
            }
            setTimeout(
                function () {
                    $("#message1").addClass("d-none");
                    },
                5000
            );
        }
        hideModal();
        $(MODAL_FOOTER).removeClass("d-none");
    }, "json");
}


function triggerSearchKeyPress() {
    $(SEARCH_BOX_ID).on("keydown", function (event) {
        if (event.which === 13) {
            $("#save-yes").click();
        }
    });
}

$(document).ready(function () {
    //Check if user is new
    checkNewUser(checkCookie());
    $(DB_SUCCESS_BTN_ID).bind("click", function () {
        hrrref = "/json?mode=getsuccessful";
        console.log(hrrref)
        $(MODAL_FOOTER).addClass("d-none");
        fetchJobs(hrrref);
    });
    $(DB_FAIL_BTN_ID).bind("click", function () {
        hrrref = "/json?mode=getfailed";
        console.log(hrrref)
        $(MODAL_FOOTER).addClass("d-none");
        fetchJobs(hrrref);
    });
    triggerSearchKeyPress();
    $("#save-yes").bind("click", function () {
        console.log(hrrref);
        // Check we have the search query & it must be more than 3 chars
        if ($("input#searchquery").length) {
            const searchQuery = $("input#searchquery").val().length;
            if (searchQuery < 3) {
                $(SEARCH_BOX_ID).addClass("is-invalid");
                return false;
            }
        }
        checkHref(addJobItem);
        return true;
    });
    $("#save-no").bind("click", function () {
        if (hrrref === "entryWarn") {
            console.log("use wants to go away");
            window.location.href = "/";
            return false;
        } else {
            console.log("user shouldn't be here...");
            $(MODEL_ID).modal("toggle");
        }
        return true;
    });
    $(MODEL_ID).on("show.bs.modal", function (event) {
        const button = $(event.relatedTarget); // Button that triggered the modal
        actionType = button.data("type"); // Extract info from data-* attributes
        hrrref = button.data("href");
        activeJob = button.data("jobid");
        const modal = $(this);
        updateModal(modal);
        triggerSearchKeyPress();
    });
});
