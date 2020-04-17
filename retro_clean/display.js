let archiveUrl = "https://s3-us-west-2.amazonaws.com/netweek2.demo/archive.json";
let archive = {}
let selectedMail = {}

window.onload = function() {
    selectMail();
    fetch(archiveUrl)
        .then(response => {
            return response.json();
        }).then((data) => {
            archive = data;
            console.log(archive);
            updateArchive();
        }).catch(err => {
            console.log(err);
        });
    addCopyLinkAction();
}

function selectMail() {
    // TODO strip off hash before searching/setting selectedMail
    // deal with snake casing
    if (location.hash) {
        selectedMail = {
            subject: location.hash
        }
    } else {
        selectedMail = {
            timestamp: 1554091200000,
            subject: "remembering st patricks day"
        }
        location.hash = selectedMail.subject.replace(/ /g, '-');
    }
}

function updateArchive() {

    const yearsDiv = document.getElementById("years");
    for (y in archive.years) {
        archiveYear = archive.years[y];
        mList = archiveYear.months;
        let numInYear = 0;
        const newYear = buildAccordionPanel(archiveYear.year, "");
        yearsDiv.appendChild(newYear);
        for (m in mList) {
            month = mList[m];
            const newMonth = buildAccordionPanel(archiveYear.year, month.name);
            newYear.lastChild.appendChild(newMonth);
            const newDiv = document.createElement("div");
            newMonth.lastChild.appendChild(newDiv);
            pList = month.posts;
            numInYear += pList.length;
            for (p in pList) {
                const archiveLink = document.createElement("a");
                archiveLink.className = "archiveLink";
                archiveLink.href = `#${pList[p].subject.replace(/ /g, "-")}`;
                archiveLink.innerText = `${pList[p].day} - ${pList[p].subject}`;
                archiveLink.id = pList[p].timestamp;
                newDiv.appendChild(archiveLink);
                newDiv.appendChild(document.createElement("br"));
            }
            updatePanelCount(archiveYear.year + month.name, pList.length);
        }
        updatePanelCount(archiveYear.year, numInYear);
    }

    applyAccordionListener();

}

function buildAccordionPanel(year, month) {
    const newAccordionPanel = document.createElement("div");
    newAccordionPanel.className = "accordion";
    const para = document.createElement("p");
    if (month) {
        para.id = year + month;
    } else {
        para.id = year;
    }
    const button = document.createElement("button");
    if (month) {
        button.innerText = month;
    } else {
        button.innerText = year;
    }
    button.className = "accordionButton";
    para.appendChild(button);
    newAccordionPanel.appendChild(para);
    const panel = document.createElement("div");
    panel.className = "panel";
    newAccordionPanel.appendChild(panel);
    return newAccordionPanel;
}

function updatePanelCount(id, count) {
    const para = document.getElementById(id);
    const span = document.createElement("span");
    span.innerText = `  (${count})`
    para.appendChild(span);
}

function applyAccordionListener() {
    var acc = document.getElementsByClassName("accordion");
    for (let i = 0; i < acc.length; i++) {
        acc[i].firstChild.firstChild.addEventListener("click", function() {
            /* Toggle between adding and removing the "active" class,
            to highlight the button that controls the panel */
            this.classList.toggle("active");

            /* Toggle between hiding and showing the active panel */
            var panel = acc[i].lastChild;
            if (panel.style.display === "block") {
                panel.style.display = "none";
            } else {
                panel.style.display = "block";
            }
        });
    }
}

function applyArchiveListener() {
    //use location.hash
    // when clicked change color 
    // use archiveDate class
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