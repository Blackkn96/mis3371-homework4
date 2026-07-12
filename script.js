/*
Name: David Kinard
File: script.js
Date created: June 27, 2026
Date updated: July 9, 2026
Version: 4.0
Purpose: External JavaScript file for Valor Veterans Medical Center Homework 4.
         Adds Fetch API (loads state list from external file), cookie tracking
         (remembers user by first name for 48 hours), and local storage (saves
         all non-secure form fields). Keeps all Homework 3 on-the-fly validation.
*/


/* ==================== CONSTANTS ==================== */

/* Name of the tracking cookie */
var COOKIE_NAME = "vvmc_firstname";

/* Key used for local storage */
var STORAGE_KEY = "vvmc_formdata";

/* Cookie lifetime in days (48 hours = 2 days) for security */
var COOKIE_DAYS = 2;


/* ==================== FETCH API ==================== */

/*
   Reads the state option list from the external file states.html
   and injects it into the state dropdown. Uses try/catch for errors.
*/
async function loadStates() {
    try {
        var response = await fetch("states.html");

        /* Check the file actually loaded */
        if (!response.ok) {
            throw new Error("Could not load states.html (status " + response.status + ")");
        }

        var stateOptions = await response.text();
        document.getElementById("state").innerHTML = stateOptions;

    } catch (error) {
        /* If fetch fails, show a fallback message in the dropdown */
        console.log("Fetch error: " + error.message);
        document.getElementById("state").innerHTML =
            "<option value=''>State list unavailable</option>";
    }
}


/* ==================== COOKIE FUNCTIONS ==================== */

/* Create or update a cookie */
function setCookie(name, value, days) {
    var expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = name + "=" + value + ";expires=" + expires.toUTCString() + ";path=/";
}

/* Read a cookie value. Returns empty string if not found. */
function getCookie(name) {
    var cookieName = name + "=";
    var allCookies = document.cookie.split(";");

    for (var i = 0; i < allCookies.length; i++) {
        var c = allCookies[i];
        /* Trim leading spaces */
        while (c.charAt(0) === " ") {
            c = c.substring(1);
        }
        if (c.indexOf(cookieName) === 0) {
            return c.substring(cookieName.length, c.length);
        }
    }
    return "";
}

/* Expire (delete) a cookie by setting its date in the past */
function deleteCookie(name) {
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/";
}


/* ==================== LOCAL STORAGE ==================== */

/*
   Saves all NON-SECURE form fields to local storage.
   SSN and passwords are intentionally NEVER saved.
*/
function saveToLocalStorage() {
    /* Only save if Remember Me is checked */
    if (!document.getElementById("remember-me").checked) {
        return;
    }

    /* Collect checked medical history checkboxes */
    var medHistory = [];
    var checkboxes = document.getElementsByName("medical_history");
    for (var i = 0; i < checkboxes.length; i++) {
        if (checkboxes[i].checked) {
            medHistory.push(checkboxes[i].value);
        }
    }

    /* Build an object with all non-secure data */
    var formData = {
        firstname: document.getElementById("firstname").value,
        middleinit: document.getElementById("middleinit").value,
        lastname: document.getElementById("lastname").value,
        dob: document.getElementById("dob").value,
        gender: getRadioValue("gender"),
        address1: document.getElementById("address1").value,
        address2: document.getElementById("address2").value,
        city: document.getElementById("city").value,
        state: document.getElementById("state").value,
        zip: document.getElementById("zip").value,
        phone1: document.getElementById("phone1").value,
        email: document.getElementById("email").value,
        preferred_contact: document.getElementById("preferred_contact").value,
        userid: document.getElementById("userid").value,
        branch_service: document.getElementById("branch_service").value,
        va_eligible: getRadioValue("va_eligible"),
        service_connected: getRadioValue("service_connected"),
        insurance: getRadioValue("insurance"),
        insurance_company: document.getElementById("insurance_company").value,
        policy_number: document.getElementById("policy_number").value,
        symptoms: document.getElementById("symptoms").value,
        vaccinated: getRadioValue("vaccinated"),
        medical_history: medHistory,
        health_rating: document.getElementById("health_rating").value
    };

    /* Save as a JSON string */
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));

    /* Also refresh the first name cookie */
    var fname = document.getElementById("firstname").value;
    if (fname !== "") {
        setCookie(COOKIE_NAME, fname, COOKIE_DAYS);
    }
}

/* Reads saved data back into the form */
function loadFromLocalStorage() {
    var saved = localStorage.getItem(STORAGE_KEY);

    /* Nothing saved, do nothing */
    if (saved === null) {
        return;
    }

    var data = JSON.parse(saved);

    /* Fill in the text fields */
    document.getElementById("firstname").value = data.firstname || "";
    document.getElementById("middleinit").value = data.middleinit || "";
    document.getElementById("lastname").value = data.lastname || "";
    document.getElementById("dob").value = data.dob || "";
    document.getElementById("address1").value = data.address1 || "";
    document.getElementById("address2").value = data.address2 || "";
    document.getElementById("city").value = data.city || "";
    document.getElementById("zip").value = data.zip || "";
    document.getElementById("phone1").value = data.phone1 || "";
    document.getElementById("email").value = data.email || "";
    document.getElementById("userid").value = data.userid || "";
    document.getElementById("insurance_company").value = data.insurance_company || "";
    document.getElementById("policy_number").value = data.policy_number || "";
    document.getElementById("symptoms").value = data.symptoms || "";

    /* Fill in the dropdowns */
    document.getElementById("state").value = data.state || "";
    document.getElementById("preferred_contact").value = data.preferred_contact || "email";
    document.getElementById("branch_service").value = data.branch_service || "";

    /* Fill in the radio buttons */
    setRadioValue("gender", data.gender);
    setRadioValue("va_eligible", data.va_eligible);
    setRadioValue("service_connected", data.service_connected);
    setRadioValue("insurance", data.insurance);
    setRadioValue("vaccinated", data.vaccinated);

    /* Fill in the checkboxes */
    if (data.medical_history) {
        var checkboxes = document.getElementsByName("medical_history");
        for (var i = 0; i < checkboxes.length; i++) {
            if (data.medical_history.indexOf(checkboxes[i].value) !== -1) {
                checkboxes[i].checked = true;
            }
        }
    }

    /* Fill in the slider and update its display */
    if (data.health_rating) {
        document.getElementById("health_rating").value = data.health_rating;
        updateHealthRating(data.health_rating);
    }
}

/* Deletes all saved local storage data */
function clearLocalStorage() {
    localStorage.removeItem(STORAGE_KEY);
}


/* ==================== RADIO BUTTON HELPERS ==================== */

/* Returns the value of the checked radio in a group */
function getRadioValue(groupName) {
    var radios = document.getElementsByName(groupName);
    for (var i = 0; i < radios.length; i++) {
        if (radios[i].checked) {
            return radios[i].value;
        }
    }
    return "";
}

/* Checks the radio button that matches the given value */
function setRadioValue(groupName, value) {
    if (!value) {
        return;
    }
    var radios = document.getElementsByName(groupName);
    for (var i = 0; i < radios.length; i++) {
        if (radios[i].value === value) {
            radios[i].checked = true;
        }
    }
}


/* ==================== REMEMBER ME CHECKBOX ==================== */

/*
   If Remember Me is UNCHECKED, expire the cookie and delete all local data.
   If Remember Me is CHECKED (or rechecked), save the data again.
*/
function handleRememberMe() {
    var rememberMe = document.getElementById("remember-me").checked;
    var note = document.getElementById("remember-note");

    if (rememberMe) {
        /* Turned back ON - save everything */
        saveToLocalStorage();
        note.innerHTML = "Your non-sensitive information will be saved for your next visit. " +
                         "Passwords and SSN are never saved.";
    } else {
        /* Turned OFF - wipe the cookie and local storage */
        deleteCookie(COOKIE_NAME);
        clearLocalStorage();
        note.innerHTML = "Your information will NOT be saved. All previously saved data has been deleted.";
    }
}


/* ==================== NEW USER / NOT ME ==================== */

/*
   Called when the user clicks the "Not you? Start as NEW USER" checkbox.
   Expires the cookie, clears local storage, and resets the whole form.
*/
function startAsNewUser() {
    /* Expire the cookie */
    deleteCookie(COOKIE_NAME);

    /* Remove all saved local storage */
    clearLocalStorage();

    /* Reset the form fields */
    document.getElementById("registrationForm").reset();
    clearForm();

    /* Hide the returning user bar */
    document.getElementById("returning-user-bar").style.display = "none";

    /* Update the welcome message to greet a new user */
    document.getElementById("welcome-message").innerHTML = "Hello New User!";

    /* Re-check remember me by default */
    document.getElementById("remember-me").checked = true;
}


/* ==================== PAGE LOAD ==================== */

/*
   Runs when the page loads:
   1. Fetch the state list from the external file
   2. Check for a cookie
   3. If found, greet the user by name and reload their saved data
   4. If not found, greet them as a new user
*/
window.onload = async function() {

    /* 1. Load the state dropdown via Fetch API */
    await loadStates();

    /* 2. Check for an existing cookie */
    var savedName = getCookie(COOKIE_NAME);

    if (savedName !== "") {
        /* 3. RETURNING USER - greet by name */
        document.getElementById("welcome-message").innerHTML = "Welcome back, " + savedName + "!";

        /* Show the "Not you?" bar with their name in it */
        document.getElementById("not-me-text").innerHTML =
            "Not " + savedName + "? Click HERE to start as a NEW USER.";
        document.getElementById("returning-user-bar").style.display = "block";

        /* Reload all their saved form data */
        loadFromLocalStorage();

        /* Make sure first name is prefilled from the cookie */
        document.getElementById("firstname").value = savedName;

    } else {
        /* 4. NEW USER - generic greeting */
        document.getElementById("welcome-message").innerHTML = "Hello New User!";
    }
};


/* ==================== HELPER FUNCTIONS ==================== */

/* Show an error message next to a field */
function showError(fieldId, message) {
    document.getElementById(fieldId + "-error").innerHTML = message;
}

/* Clear an error message from a field */
function clearError(fieldId) {
    document.getElementById(fieldId + "-error").innerHTML = "";
}


/* ==================== SLIDE BAR ==================== */

/* Update the health rating value shown next to the slider */
function updateHealthRating(value) {
    document.getElementById("health_rating_value").innerHTML = value;
}


/* ==================== SSN AUTO-FORMAT ==================== */

/* Automatically insert dashes as the user types the SSN */
function formatSSN() {
    var ssnField = document.getElementById("ssn");
    var digits = ssnField.value.replace(/[^0-9]/g, "");   /* strip non-digits */
    if (digits.length > 9) {
        digits = digits.substring(0, 9);                  /* max 9 digits */
    }
    var formatted = digits;
    if (digits.length > 5) {
        formatted = digits.substring(0, 3) + "-" + digits.substring(3, 5) + "-" + digits.substring(5);
    } else if (digits.length > 3) {
        formatted = digits.substring(0, 3) + "-" + digits.substring(3);
    }
    ssnField.value = formatted;
}


/* ==================== FIELD VALIDATION FUNCTIONS ==================== */

/* First Name: 1-30 chars, letters, apostrophes, dashes only */
function validateFirstName() {
    var value = document.getElementById("firstname").value;
    var pattern = /^[A-Za-z'\-]{1,30}$/;
    if (value === "") {
        showError("firstname", "First name is required.");
        return false;
    } else if (!pattern.test(value)) {
        showError("firstname", "Letters, apostrophes and dashes only (1-30 characters).");
        return false;
    }
    clearError("firstname");
    return true;
}

/* Middle Initial: optional, 1 letter only */
function validateMiddleInit() {
    var value = document.getElementById("middleinit").value;
    var pattern = /^[A-Za-z]$/;
    if (value === "") {
        clearError("middleinit");   /* optional field */
        return true;
    } else if (!pattern.test(value)) {
        showError("middleinit", "Must be a single letter.");
        return false;
    }
    clearError("middleinit");
    return true;
}

/* Last Name: 1-30 chars, letters, apostrophes, dashes only */
function validateLastName() {
    var value = document.getElementById("lastname").value;
    var pattern = /^[A-Za-z'\-]{1,30}$/;
    if (value === "") {
        showError("lastname", "Last name is required.");
        return false;
    } else if (!pattern.test(value)) {
        showError("lastname", "Letters, apostrophes and dashes only (1-30 characters).");
        return false;
    }
    clearError("lastname");
    return true;
}

/* Date of Birth: MM/DD/YYYY, not future, not more than 120 years ago */
function validateDOB() {
    var value = document.getElementById("dob").value;
    var pattern = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/(19|20)\d{2}$/;

    if (value === "") {
        showError("dob", "Date of birth is required.");
        return false;
    }
    if (!pattern.test(value)) {
        showError("dob", "Use MM/DD/YYYY format.");
        return false;
    }

    /* Split into pieces and build a date object */
    var arr = value.split("/");
    var month = parseInt(arr[0], 10);
    var day   = parseInt(arr[1], 10);
    var year  = parseInt(arr[2], 10);
    var birthDate = new Date(year, month - 1, day);
    var today = new Date();

    /* Cannot be in the future */
    if (birthDate > today) {
        showError("dob", "Date of birth cannot be in the future.");
        return false;
    }

    /* Cannot be more than 120 years ago */
    var oldest = new Date();
    oldest.setFullYear(today.getFullYear() - 120);
    if (birthDate < oldest) {
        showError("dob", "Date of birth cannot be more than 120 years ago.");
        return false;
    }

    clearError("dob");
    return true;
}

/* SSN: must be 9 digits (formatted as XXX-XX-XXXX) */
function validateSSN() {
    var value = document.getElementById("ssn").value;
    var pattern = /^\d{3}-\d{2}-\d{4}$/;
    if (value === "") {
        showError("ssn", "SSN is required.");
        return false;
    } else if (!pattern.test(value)) {
        showError("ssn", "Must be 9 digits.");
        return false;
    }
    clearError("ssn");
    return true;
}

/* Gender: one radio must be selected */
function validateGender() {
    var radios = document.getElementsByName("gender");
    var checked = false;
    for (var i = 0; i < radios.length; i++) {
        if (radios[i].checked) { checked = true; break; }
    }
    if (!checked) {
        showError("gender", "Please select a gender.");
        return false;
    }
    clearError("gender");
    return true;
}

/* Address Line 1: required, 2-30 chars */
function validateAddress1() {
    var value = document.getElementById("address1").value;
    if (value === "") {
        showError("address1", "Address is required.");
        return false;
    } else if (value.length < 2 || value.length > 30) {
        showError("address1", "Must be 2-30 characters.");
        return false;
    }
    clearError("address1");
    return true;
}

/* Address Line 2: optional, but if entered must be 2-30 chars */
function validateAddress2() {
    var value = document.getElementById("address2").value;
    if (value === "") {
        clearError("address2");   /* optional */
        return true;
    } else if (value.length < 2 || value.length > 30) {
        showError("address2", "Must be 2-30 characters.");
        return false;
    }
    clearError("address2");
    return true;
}

/* City: required, 2-30 chars */
function validateCity() {
    var value = document.getElementById("city").value;
    if (value === "") {
        showError("city", "City is required.");
        return false;
    } else if (value.length < 2 || value.length > 30) {
        showError("city", "Must be 2-30 characters.");
        return false;
    }
    clearError("city");
    return true;
}

/* State: must select a value (not the blank default) */
function validateState() {
    var value = document.getElementById("state").value;
    if (value === "") {
        showError("state", "Please select a state.");
        return false;
    }
    clearError("state");
    return true;
}

/* Zip: 5 digits, or ZIP+4 format */
function validateZip() {
    var value = document.getElementById("zip").value;
    var pattern = /^\d{5}(-\d{4})?$/;
    if (value === "") {
        showError("zip", "Zip code is required.");
        return false;
    } else if (!pattern.test(value)) {
        showError("zip", "Must be 5 digits (or 12345-6789).");
        return false;
    }
    clearError("zip");
    return true;
}

/* Phone: 123-456-7890 format */
function validatePhone() {
    var value = document.getElementById("phone1").value;
    var pattern = /^\d{3}-\d{3}-\d{4}$/;
    if (value === "") {
        showError("phone1", "Phone number is required.");
        return false;
    } else if (!pattern.test(value)) {
        showError("phone1", "Use 123-456-7890 format.");
        return false;
    }
    clearError("phone1");
    return true;
}

/* Email: name@domain.tld, forced to lowercase */
function validateEmail() {
    var emailField = document.getElementById("email");
    emailField.value = emailField.value.toLowerCase();   /* force lowercase */
    var value = emailField.value;
    var pattern = /^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/;
    if (value === "") {
        showError("email", "Email is required.");
        return false;
    } else if (!pattern.test(value)) {
        showError("email", "Use name@domain.tld format.");
        return false;
    }
    clearError("email");
    return true;
}

/* User ID: 5-20 chars, starts with letter, letters/numbers/dash/underscore, no spaces */
function validateUserID() {
    var value = document.getElementById("userid").value;
    var pattern = /^[A-Za-z][A-Za-z0-9_\-]{4,19}$/;
    if (value === "") {
        showError("userid", "User ID is required.");
        return false;
    } else if (/^[0-9]/.test(value)) {
        showError("userid", "Cannot start with a number.");
        return false;
    } else if (/\s/.test(value)) {
        showError("userid", "Cannot contain spaces.");
        return false;
    } else if (!pattern.test(value)) {
        showError("userid", "5-20 chars: letters, numbers, dash, underscore only.");
        return false;
    }
    clearError("userid");
    return true;
}

/* Password: 8-30 chars, 1 upper, 1 lower, 1 digit, 1 special, not equal to User ID */
function validatePassword() {
    var value = document.getElementById("password").value;
    var userid = document.getElementById("userid").value;

    if (value === "") {
        showError("password", "Password is required.");
        return false;
    }
    if (value.length < 8 || value.length > 30) {
        showError("password", "Must be 8-30 characters.");
        return false;
    }
    if (!/[A-Z]/.test(value)) {
        showError("password", "Must contain at least 1 uppercase letter.");
        return false;
    }
    if (!/[a-z]/.test(value)) {
        showError("password", "Must contain at least 1 lowercase letter.");
        return false;
    }
    if (!/[0-9]/.test(value)) {
        showError("password", "Must contain at least 1 number.");
        return false;
    }
    if (!/[!@#%^&*()\-_+=\/><.,`~]/.test(value)) {
        showError("password", "Must contain at least 1 special character.");
        return false;
    }
    if (/"/.test(value)) {
        showError("password", "Double quotes are not allowed.");
        return false;
    }
    if (userid !== "" && value.toLowerCase() === userid.toLowerCase()) {
        showError("password", "Password cannot equal your User ID.");
        return false;
    }
    clearError("password");

    /* Re-check confirm field in case it was already filled */
    if (document.getElementById("confirm_password").value !== "") {
        validateConfirmPassword();
    }
    return true;
}

/* Confirm Password: must match the password field */
function validateConfirmPassword() {
    var password = document.getElementById("password").value;
    var confirm = document.getElementById("confirm_password").value;
    if (confirm === "") {
        showError("confirm_password", "Please re-enter your password.");
        return false;
    } else if (password !== confirm) {
        showError("confirm_password", "Passwords do not match.");
        return false;
    }
    clearError("confirm_password");
    return true;
}

/* Insurance: one radio must be selected */
function validateInsurance() {
    var radios = document.getElementsByName("insurance");
    var checked = false;
    for (var i = 0; i < radios.length; i++) {
        if (radios[i].checked) { checked = true; break; }
    }
    if (!checked) {
        showError("insurance", "Please select an option.");
        return false;
    }
    clearError("insurance");
    return true;
}

/* Vaccinated: one radio must be selected */
function validateVaccinated() {
    var radios = document.getElementsByName("vaccinated");
    var checked = false;
    for (var i = 0; i < radios.length; i++) {
        if (radios[i].checked) { checked = true; break; }
    }
    if (!checked) {
        showError("vaccinated", "Please select an option.");
        return false;
    }
    clearError("vaccinated");
    return true;
}

/* Symptoms: required, no double quotes */
function validateSymptoms() {
    var value = document.getElementById("symptoms").value;
    if (value === "") {
        showError("symptoms", "Please describe your symptoms.");
        return false;
    } else if (/"/.test(value)) {
        showError("symptoms", "Please do not use double quotes.");
        return false;
    }
    clearError("symptoms");
    return true;
}


/* ==================== VALIDATE BUTTON ==================== */

/* Runs every validation. Shows the Submit button only if all pass. */
function validateForm() {
    /* Run every field validation and collect the results */
    var results = [
        validateFirstName(),
        validateMiddleInit(),
        validateLastName(),
        validateDOB(),
        validateSSN(),
        validateGender(),
        validateAddress1(),
        validateAddress2(),
        validateCity(),
        validateState(),
        validateZip(),
        validatePhone(),
        validateEmail(),
        validateUserID(),
        validatePassword(),
        validateConfirmPassword(),
        validateInsurance(),
        validateVaccinated(),
        validateSymptoms()
    ];

    /* Count how many failed */
    var errorCount = 0;
    for (var i = 0; i < results.length; i++) {
        if (results[i] === false) { errorCount++; }
    }

    var summary = document.getElementById("error-summary");
    var submitBtn = document.getElementById("submitBtn");

    if (errorCount === 0) {
        /* All good - reveal the Submit button */
        summary.style.display = "block";
        summary.style.color = "#1b6b2f";
        summary.innerHTML = "All fields look good! You may now submit your form.";
        submitBtn.style.display = "inline-block";
    } else {
        /* Errors present - keep Submit hidden */
        summary.style.display = "block";
        summary.style.color = "#c62828";
        summary.innerHTML = "Please fix the " + errorCount + " highlighted error(s) above before submitting.";
        submitBtn.style.display = "none";
    }
}


/* ==================== REVIEW BUTTON ==================== */

/* Displays all entered data in a table (kept from Homework 2) */
function reviewForm() {
    var firstname = document.getElementById("firstname").value;
    var middleinit = document.getElementById("middleinit").value;
    var lastname = document.getElementById("lastname").value;
    var dob = document.getElementById("dob").value;
    var gender = getRadioValue("gender");

    var address1 = document.getElementById("address1").value;
    var address2 = document.getElementById("address2").value;
    var city = document.getElementById("city").value;
    var state = document.getElementById("state").value;
    var zip = document.getElementById("zip").value;
    var phone = document.getElementById("phone1").value;
    var email = document.getElementById("email").value;
    var userid = document.getElementById("userid").value;
    var symptoms = document.getElementById("symptoms").value;
    var health_rating = document.getElementById("health_rating").value;

    var medicalHistory = [];
    var checkboxes = document.getElementsByName("medical_history");
    for (var i = 0; i < checkboxes.length; i++) {
        if (checkboxes[i].checked) { medicalHistory.push(checkboxes[i].value); }
    }
    var medStr = medicalHistory.length > 0 ? medicalHistory.join(", ") : "None selected";

    var reviewHTML =
        "<table id='review-table'>" +
        "<tr><th colspan='2'>PLEASE REVIEW YOUR INFORMATION</th></tr>" +
        "<tr><td>Full Name:</td><td>" + firstname + " " + middleinit + " " + lastname + "</td></tr>" +
        "<tr><td>Date of Birth:</td><td>" + dob + "</td></tr>" +
        "<tr><td>SSN:</td><td>***-**-****</td></tr>" +
        "<tr><td>Gender:</td><td>" + (gender || "Not selected") + "</td></tr>" +
        "<tr><td>Address:</td><td>" + address1 + " " + address2 + "</td></tr>" +
        "<tr><td>City, State, Zip:</td><td>" + city + ", " + state + " " + zip + "</td></tr>" +
        "<tr><td>Phone:</td><td>" + phone + "</td></tr>" +
        "<tr><td>Email:</td><td>" + email + "</td></tr>" +
        "<tr><td>User ID:</td><td>" + userid + "</td></tr>" +
        "<tr><td>Password:</td><td>********</td></tr>" +
        "<tr><td>Symptoms:</td><td>" + symptoms + "</td></tr>" +
        "<tr><td>Medical History:</td><td>" + medStr + "</td></tr>" +
        "<tr><td>Health Rating:</td><td>" + health_rating + " / 10</td></tr>" +
        "</table>";

    document.getElementById("review-content").innerHTML = reviewHTML;
    document.getElementById("review-section").style.display = "block";
    document.getElementById("review-section").scrollIntoView({ behavior: "smooth" });
}


/* ==================== CLEAR FORM ==================== */

/* Hide review, error summary, submit button; reset slider display */
function clearForm() {
    document.getElementById("review-section").style.display = "none";
    document.getElementById("review-content").innerHTML = "";
    document.getElementById("error-summary").style.display = "none";
    document.getElementById("submitBtn").style.display = "none";
    document.getElementById("health_rating").value = "5";
    document.getElementById("health_rating_value").innerHTML = "5";

    /* Clear all error messages */
    var errors = document.getElementsByClassName("error-msg");
    for (var i = 0; i < errors.length; i++) {
        errors[i].innerHTML = "";
    }
}

/* ==================== END OF DOCUMENT: script.js ==================== */
