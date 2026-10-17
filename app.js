"use strict";

const SECOND = 1000;
const MINUTE = SECOND * 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;
const STORAGE_KEY = "birthday-countdown";

const els = {
    title: document.getElementById("title"),
    message: document.getElementById("message"),
    days: document.getElementById("days"),
    hours: document.getElementById("hours"),
    minutes: document.getElementById("minutes"),
    seconds: document.getElementById("seconds"),
    form: document.getElementById("settings"),
    name: document.getElementById("name"),
    date: document.getElementById("date"),
};

let birthday = null; // { month: 0-11, day: 1-31 }
let name = "";
let timerId = null;

function loadSettings() {
    const params = new URLSearchParams(location.search);
    let saved = {};
    try {
        saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (e) {
        saved = {};
    }
    return {
        name: params.get("name") ?? saved.name ?? "",
        date: params.get("date") ?? saved.date ?? "",
    };
}

function saveSettings() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ name, date: els.date.value }));
    } catch (e) {
        // Speichern nicht möglich (z. B. privater Modus) - kein Problem
    }
}

// "YYYY-MM-DD" -> { month, day }; null bei ungültigem Datum
function parseBirthday(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return null;
    const [, year, month, day] = match.map(Number);
    const check = new Date(year, month - 1, day);
    if (check.getMonth() !== month - 1 || check.getDate() !== day) return null;
    return { month: month - 1, day };
}

// 29. Februar fällt in Nicht-Schaltjahren automatisch auf den 1. März
function occurrence(year) {
    return new Date(year, birthday.month, birthday.day);
}

function nextBirthday(now) {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisYear = occurrence(now.getFullYear());
    return thisYear >= startOfToday ? thisYear : occurrence(now.getFullYear() + 1);
}

function pad(n) {
    return String(n).padStart(2, "0");
}

function render() {
    const now = new Date();
    const target = nextBirthday(now);
    const isToday = target.toDateString() === now.toDateString();
    const who = name ? `${name}'s` : "the";

    document.body.classList.toggle("party", isToday);
    if (isToday) {
        els.message.textContent = `🎉 Happy Birthday${name ? ", " + name : ""}!`;
        els.days.textContent = "0";
        els.hours.textContent = els.minutes.textContent = els.seconds.textContent = "00";
        return;
    }

    const diff = target - now;
    const dateText = target.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
    els.message.textContent = `Until ${who} birthday on ${dateText}`;
    els.days.textContent = Math.floor(diff / DAY);
    els.hours.textContent = pad(Math.floor((diff % DAY) / HOUR));
    els.minutes.textContent = pad(Math.floor((diff % HOUR) / MINUTE));
    els.seconds.textContent = pad(Math.floor((diff % MINUTE) / SECOND));
}

function apply(settings) {
    name = settings.name.trim();
    birthday = parseBirthday(settings.date);
    els.name.value = name;
    els.date.value = birthday ? settings.date : "";
    els.title.textContent = name ? `${name}'s Birthday Countdown` : "Birthday Countdown";
    clearInterval(timerId);

    if (!birthday) {
        document.body.classList.remove("party");
        els.message.textContent = "Pick a birthday below to start the countdown.";
        return;
    }
    render();
    timerId = setInterval(render, SECOND);
}

els.form.addEventListener("submit", (event) => {
    event.preventDefault();
    apply({ name: els.name.value, date: els.date.value });
    saveSettings();
});

apply(loadSettings());
