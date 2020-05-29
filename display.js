let archiveUrl = "https://zg6gt7krsj.execute-api.us-east-1.amazonaws.com/prod/";
// chronological order of emails for archive pane
let archive = {};
// chronological order of emails for toggling main view
let timeline = [];
// index in timeline of email currently selected
let timelinePos = 0;
// currently selected email
let selectedMail = {};
// utility for parsing and displaying dates
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
// alphabetically arranged email topics
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
                applyAccordionListener();
                selectMail();
            });
    }
    addCopyLinkAction();
    const sessionTopics = JSON.parse(sessionStorage.getItem('topics'));
    if (sessionTopics) {
        // access cached topics, if they exist
        topics = sessionTopics;
        updateTopics();
        applyAccordionListener();
    } else {
        fetch(archiveUrl + 'topics')
            .then(response => {
                return response.json();
            }).then(data => {
                topics = data;
                sessionStorage.setItem('topics', JSON.stringify(topics));
                updateTopics();
                applyAccordionListener();
            })
            // todo log error
    }
}

function selectMail() {
    if (location.hash) {
        fetchMailBySubject(location.hash.substring(1));
    } else {
        jumpTime();
    }
}

function jumpTime(destination) {
    let index;
    if (destination === "forward") {
        index = (parseInt(timelinePos) < timeline.length - 1) ? parseInt(timelinePos) + 1 : timeline.length - 1;
    } else if (destination === "back") {
        index = (timelinePos > 1) ? timelinePos - 1 : 0;
    } else if (destination === "start") {
        index = 0;
    } else if (destination === "end") {
        index = timeline.length - 1;
    } else {
        index = Math.floor(Math.random() * timeline.length);
    }
    fetchMailBySubject(timeline[index].subject);
}

async function fetchMailBySubject(subject) {
    encodedSubj = encodeURIComponent(decodeURI(subject));
    fetch(`${archiveUrl}archive/${encodedSubj}`)
        .then(response => {
            return response.json();
        }).then(data => {
            document.title = data.subject;
            selectedMail = data;
            updateSelectedMail();
            updateSelectedTopics();
            for (let i in timeline) {
                if (timeline[i].subject === selectedMail.subject) {
                    timelinePos = i;
                }
            }
        }).catch(error => {
            document.title = "Welcome to Email Pro";
            selectedMail = {
                subject: "",
                timestamp: "divide by zero",
                markdown: "error"
            }
            updateSelectedMail();
            updateSelectedTopics();
        });
}

function updateSelectedMail() {
    location.hash = selectedMail.subject;
    document.getElementById("subj").innerText = selectedMail.subject;
    document.getElementById("content").innerHTML = selectedMail.markdown;
    const dateString = parseInt(selectedMail.timestamp);
    const date = new Date(dateString);
    document.getElementById("date").innerText = dateString ? `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}` : selectedMail.timestamp;
}

function updateSelectedTopics() {
    const sTopics = topics.filter(t => t.emails.includes(selectedMail.subject));
    const sTSpan = document.getElementById("selectedTopics");
    sTSpan.innerHTML = "";
    for (st of sTopics) {
        const newEm = document.createElement("em");
        newEm.innerText = st.name;
        newEm.className = 'linkalike';
        newEm.onclick = (event) => {
            document.getElementById(event.target.innerText).classList.add("active");
            panel = document.getElementById(`${event.target.innerText}-panel`);
            panel.style.display = "block";
            panel.scrollIntoView();
        }
        sTSpan.appendChild(newEm);
    }
}

function updateArchive() {

    const yearsDiv = document.getElementById("years");
    for (y in archive.years) {
        archiveYear = archive.years[y];
        mList = archiveYear.months;
        const newYear = buildArchivePanel(archiveYear.year, "");
        yearsDiv.appendChild(newYear);
        for (m in mList) {
            month = mList[m];
            const newMonth = buildArchivePanel(archiveYear.year, month.month);
            newYear.lastChild.appendChild(newMonth);
            const newDiv = document.createElement("div");
            newMonth.lastChild.appendChild(newDiv);
            eList = month.emails;
            for (e in eList) {
                timeline.push({ subject: eList[e].subject, timestamp: eList[e].timestamp });
                const archiveLink = buildLink(`#${encodeURI(eList[e].subject)}`, `- ${eList[e].subject}`);
                newDiv.appendChild(archiveLink);
                newDiv.appendChild(document.createElement("br"));
            }
        }
    }

}

function buildArchivePanel(year, month) {
    const newPanel = document.createElement("div");
    newPanel.className = "accordion";
    const para = document.createElement("p");
    const button = document.createElement("button");
    if (month || month === 0) {
        button.innerText = months[month];
        button.id = `${year}-${month}`;
    } else {
        button.innerText = year;
        button.id = `${year}`;
    }
    button.className = "accordionButton";
    para.appendChild(button);
    newPanel.appendChild(para);
    const panel = document.createElement("div");
    panel.id = `${button.id}-panel`;
    panel.className = "panel";
    newPanel.appendChild(panel);
    return newPanel;
}

function applyAccordionListener() {
    let acc = document.getElementsByClassName("accordion");
    for (let i = 0; i < acc.length; i++) {
        acc[i].firstChild.firstChild.addEventListener("click", function() {
            /* Toggle between adding and removing the "active" class,
            to highlight the button that controls the panel */
            this.classList.toggle("active");

            /* Toggle between hiding and showing the active panel */
            var panel = document.getElementById(`${this.id}-panel`);
            if (panel.style.display === "block") {
                panel.style.display = "none";
            } else {
                panel.style.display = "block";
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
        tButton.id = t.name;
        tbSpan.appendChild(tButton);
        tSpan.appendChild(tbSpan);
        buildTopicPanel(t, tSpan);
        topicsDiv.appendChild(tSpan);
    }
    const sTopics = topics.filter((t) => {
        t.emails.includes(selectedMail.subject)
    });
}

function buildTopicPanel(topic, parent) {
    const newPanel = document.createElement("div");
    newPanel.className = "panel";
    newPanel.id = `${topic.name}-panel`;
    for (email of topic.emails) {
        const newPara = document.createElement("p");
        newPara.appendChild(buildLink(`#${email}`, `- ${email}`));
        newPanel.appendChild(newPara);
    }
    parent.appendChild(newPanel);
}