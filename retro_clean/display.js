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
            updateArchive();
        });
    addCopyLinkAction();
}

function selectMail() {
    // TODO strip off hash before searching/setting selectedMail
    // deal with snake casing
    if (location.hash) {
        console.log(`selecting email with subj ${location.hash}`)
        selectedMail = {
            subject: location.hash
        }
    } else {
        console.log("selecting a random email and setting as selectedmail")
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
        const newYear = buildAccordionPanel(archive.years[y].year);
        yearsDiv.appendChild(newYear);
        mList = archive.years[y].months;
        for (m in mList) {
            const newMonth = buildAccordionPanel(mList[m].name);
            newYear.lastChild.appendChild(newMonth);
            const newUl = document.createElement("ul");
            newMonth.lastChild.appendChild(newUl);
            pList = mList[m].posts;
            for (p in pList) {
                const archiveLink = document.createElement("li");
                archiveLink.className = "archiveLink";
                archiveLink.innerText = pList[p].day;
                archiveLink.id = pList[p].timestamp;
                newUl.appendChild(archiveLink);
            }

        }
    }

    applyAccordionListener();

}

function buildAccordionPanel(title) {
    const newAccordionPanel = document.createElement("div");
    newAccordionPanel.className = "accordion";
    const para = document.createElement("p");
    const button = document.createElement("button");
    button.innerText = title;
    button.className = "accordionButton";
    para.appendChild(button);
    newAccordionPanel.appendChild(para);
    const panel = document.createElement("div");
    panel.className = "panel";
    newAccordionPanel.appendChild(panel);
    return newAccordionPanel;
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