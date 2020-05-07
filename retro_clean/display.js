let archiveUrl = "https://zg6gt7krsj.execute-api.us-east-1.amazonaws.com/prod/";
let archive = {};
let timeline = [];
let selectedMail = {};
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
let topics = [];

window.onload = function() {
    const sessionArchive = sessionStorage.getItem('archive');
    if (sessionArchive) {
        // access cached archive, if it exists
        archive = JSON.parse(sessionArchive);
        updateArchive();
        selectMail();
    } else {
        fetch(archiveUrl + 'archive')
            .then(response => {
                return response.json();
            }).then(data => {
                archive = data;
                sessionStorage.setItem('archive', JSON.stringify(archive));
                updateArchive();
                selectMail();
            });
    }
    addCopyLinkAction();
    const sessionTopics = sessionStorage.getItem('topics');
    if (sessionTopics) {
        // access cached topics, if they exist
        topics = JSON.parse(sessionTopics);
        updateTopics();
    } else {
        fetch(archiveUrl + 'topics')
            .then(response => {
                return response.json();
            }).then(data => {
                topics = data;
                this.sessionStorage.setItem('topics', JSON.stringify(topics));
                updateTopics();
            })
    }
    applyAccordionListener();
}

function selectMail() {
    if (location.hash) {
        selectedMail = {
            subject: decodeURI(location.hash.substring(1))
        }
    } else {
        selectedMail = {
            timestamp: 1554091200000,
            subject: "remembering st patricks day"
        }
        location.hash = encodeURI(selectedMail.subject);
    }
    document.title = selectedMail.subject;
}

function updateArchive() {

    const yearsDiv = document.getElementById("years");
    for (y in archive.years) {
        archiveYear = archive.years[y];
        mList = archiveYear.months;
        // let numInYear = 0;
        const newYear = buildArchivePanel(archiveYear.year, "");
        yearsDiv.appendChild(newYear);
        for (m in mList) {
            month = mList[m];
            const newMonth = buildArchivePanel(archiveYear.year, month.month);
            newYear.lastChild.appendChild(newMonth);
            const newDiv = document.createElement("div");
            newMonth.lastChild.appendChild(newDiv);
            eList = month.emails;
            // numInYear += eList.length;
            for (e in eList) {
                timeline.push({ subject: eList[e].subject, timestamp: eList[e].timestamp });
                const archiveLink = buildLink(`#${encodeURI(eList[e].subject)}`, `${eList[e].day} - ${eList[e].subject}`);
                newDiv.appendChild(archiveLink);
                newDiv.appendChild(document.createElement("br"));
            }
            // updatePanelCount(archiveYear.year + month.name, eList.length);
        }
        // updatePanelCount(archiveYear.year, numInYear);
    }

}

function buildArchivePanel(year, month) {
    const newPanel = document.createElement("div");
    newPanel.className = "accordion";
    const para = document.createElement("p");
    if (month) {
        para.id = year + month;
    } else {
        para.id = year;
    }
    const button = document.createElement("button");
    if (month) {
        button.innerText = months[month];
    } else {
        button.innerText = year;
    }
    button.className = "accordionButton";
    para.appendChild(button);
    newPanel.appendChild(para);
    const panel = document.createElement("div");
    panel.className = "panel";
    newPanel.appendChild(panel);
    return newPanel;
}

function updatePanelCount(id, count) {
    const para = document.getElementById(id);
    const span = document.createElement("span");
    span.innerText = `  (${count})`
    para.appendChild(span);
}

function applyAccordionListener() {
    let acc = document.getElementsByClassName("accordion");
    for (let i = 0; i < acc.length; i++) {
        acc[i].firstChild.firstChild.addEventListener("click", function() {
            /* Toggle between adding and removing the "active" class,
            to highlight the button that controls the panel */
            this.classList.toggle("active");

            /* Toggle between hiding and showing the active panel */
            var panel = acc[i].lastChild;
            if (panel.style.display === "block") {
                panel.style.display = "none";
                // acc[i].firstChild.lastChild.style.display = "inline";
            } else {
                panel.style.display = "block";
                // acc[i].firstChild.lastChild.style.display = "none";
            }
        });
    }
}

function buildLink(target, text) {
    const link = document.createElement("a");
    link.href = target;
    link.innerText = text;
    link.onclick = function() {
        location.hash = link.hash;
        selectMail();
    };
    return link;
}

function addCopyLinkAction() {
    document.getElementById("copyLink").addEventListener("click", function() {
        let dummy = document.createElement('input'),
            text = window.location.href;
        document.body.appendChild(dummy);
        dummy.value = text;
        dummy.select();
        document.execCommand('copy');
        document.body.removeChild(dummy);
    });
}

function updateTopics() {
    const topicsDiv = document.getElementById("topicCloud");
    for (let t of topics) {
        const tSpan = document.createElement("span");
        tSpan.className = "accordion";
        tbSpan = document.createElement("span");
        const tButton = document.createElement("button");
        tButton.className = "accordionButton";
        tButton.innerText = t.name;
        tbSpan.appendChild(tButton);
        tSpan.appendChild(tbSpan);
        buildTopicPanel(t, tSpan);
        topicsDiv.appendChild(tSpan);
    }
}

function buildTopicPanel(topic, parent) {
    const newPanel = document.createElement("div");
    newPanel.className = "panel";
    for (email of topic.emails) {
        const newPara = document.createElement("p");
        newPara.appendChild(buildLink(`#${encodeURI(email)}`, email));
        newPanel.appendChild(newPara);
    }
    parent.appendChild(newPanel);
}