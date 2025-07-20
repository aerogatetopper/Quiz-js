<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
<script>
    document.addEventListener("DOMContentLoaded", function() {
        MathJax.typeset();
    });
</script>
<script>
    MathJax = {
        tex: {
            inlineMath: [
                ['\\(', '\\)'],
                ['$', '$']
            ]
        },
        chtml: {
            scale: 120
        }
    };
</script>
<script async="" src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js"></script>

<script>
    document.addEventListener("DOMContentLoaded", function() {
        MathJax.typeset();
    });

    function replaceTextsubscriptWithHTML() {
        document.querySelectorAll(".question").forEach(el => {
            el.innerHTML = el.innerHTML.replace(/\\textsubscript\{(.*?)\}/g, '<sub>$1</sub>');
        });
    }

    // Run after DOM is fully loaded
    document.addEventListener("DOMContentLoaded", replaceTextsubscriptWithHTML);
</script>

<!-- Define subject buttons dynamically -->
<script>
    document.addEventListener("DOMContentLoaded", function() {
        const questions = document.querySelectorAll(".question");
        const subjects = new Set();

        // Collect unique subjects
        questions.forEach((q) => {
            const subject = q.getAttribute("data-subject");
            if (subject) subjects.add(subject);
        });

        const buttonGroup = document.getElementById("subject-button-group");
        buttonGroup.innerHTML = "";

        if (subjects.size > 1) {
            buttonGroup.style.display = "flex";
            subjects.forEach((subject) => {
                const button = document.createElement("button");
                button.textContent = subject;
                button.onclick = function() {
                    showSubject(subject);
                };
                buttonGroup.appendChild(button);
            });
        } else {
            // Hide the subject button group only
            buttonGroup.style.display = "none";
        }
    });
</script>

<script>
    document.addEventListener("DOMContentLoaded", function() {
        const questions = document.querySelectorAll('.question');
        const totalQuestions = questions.length;

        // let countdownMinutes = 1 * totalQuestions;

        // Total quiz time in minutes (can make dynamic later)
        const totalTime = countdownMinutes;

        const infoHTML = `
                <div style="
                    background: #ffffff;
                    border-radius: 10px;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
                    padding: 10px;
                    margin-top: 10px;
                    font-family: 'Segoe UI', sans-serif;
                    text-align: left;">
                    <h2 style="margin-bottom: 15px;text-align:center; color: #0056b3;">
                        📋 Quiz Summary
                    </h2>
                    <div style="display: flex; flex-direction: row; gap: 10px;">
                        <p style="font-size: 14px; padding:20px;">
                            📝 <strong>Total Question:</strong> <span style="color: #333; font-weight:bold;">  ${totalQuestions}</span>
                        </p>
                        <p style="font-size: 14px;padding:20px;">
                            ⏱️ <strong>Total Time:</strong> <span style="color: #007bff;font-weight:bold;">${totalTime} min</span>
                        </p>
                    </div>
                </div>
            `;

        const form = document.getElementById('registrationForm');
        form.insertAdjacentHTML('beforeend', infoHTML);
    });
</script>

<!-- Quiz apply on Result -->
<script>
    let currentQuestionIndex = 0;
    let questions = [];
    let timerInterval;
    const questionStartTimes = [];
    let timeTakenArray = {};
    let subjectData = {};
    let userName = '';
    let countdownMinutes = 50;
    let countdownSeconds = countdownMinutes * 60;
    let targetTime;
    let titlequiz = '';
    let user = '';
    let isAwaitingConfirmation = false; // Track if we're waiting for confirmation
    let hasConfirmedSubmit = false; // Track if user actually confirmed
    let currentSubject = '';
    let shuffledOrderPerSubject = {}; // { subject1: [id1, id2, ...], subject2: [...] }



    document.getElementById("registrationForm").addEventListener("submit", function(e) {
        e.preventDefault();
        var formData = new FormData(this);
        userName = formData.get('username');
        user = formData.get('username');
        titlequiz = formData.get('password');
        document.getElementById('quiz-title').textContent = formData.get('TitleQuiz');
        document.getElementById('user-display').textContent = userName;

        // Hide user-info and show start-page immediately
        document.getElementById('user-info').style.display = 'none';
        document.getElementById('start-page').style.display = 'block';

        fetch("https://script.google.com/macros/s/AKfycbyrfDJmI2KwyzUJOY8yCTTpuHIuqSLu2gbGPC0q8Lvqd7GeURM9PjqtKjXXkG9E14dO/exec", {
                method: "POST",
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (!data.success) {
                    alert("Error: " + data.error);
                    // Optionally show the user-info back if there was an error
                    document.getElementById('user-info').style.display = 'block';
                    document.getElementById('start-page').style.display = 'none';
                }
            })
            .catch(error => {
                console.error("Fetch error:", error);
                alert("There was an error processing your request.");
                // Optionally show the user-info back if there was an error
                document.getElementById('user-info').style.display = 'block';
                document.getElementById('start-page').style.display = 'none';
            });
    });

    document.getElementById('calc-btn').addEventListener('click', function() {
        const calcContainer = document.getElementById('calc-container');

        const isVisible = calcContainer.style.display === 'block';

        if (isVisible) {
            calcContainer.style.display = 'none';
        } else {
            calcContainer.style.display = 'block';
            calcContainer.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
        const fullscreenContainer = document.getElementById('fullscreen-container');
        fullscreenContainer.appendChild(calcContainer);
    });

    const calcContainer = document.getElementById('calc-container');
    let offsetX, offsetY, isDragging = false;

    calcContainer.addEventListener('mousedown', (e) => {
        isDragging = true;
        offsetX = e.clientX - calcContainer.getBoundingClientRect().left;
        offsetY = e.clientY - calcContainer.getBoundingClientRect().top;
        document.addEventListener('mousemove', moveAt);
    });

    document.addEventListener('fullscreenchange', function() {
        const isFullscreenExited = !document.fullscreenElement &&
            !document.mozFullScreenElement &&
            !document.webkitFullscreenElement &&
            !document.msFullscreenElement;

        if (isFullscreenExited) {
            if (isAwaitingConfirmation && !hasConfirmedSubmit) {
                // User clicked submit but hasn't confirmed yet → DO NOT auto-submit
                console.log("Fullscreen exited during confirmation. Not auto-submitting.");
                return;
            }

            if (!hasConfirmedSubmit) {
                // User exited fullscreen directly (via ESC or minimize) → Auto-submit
                console.log("Fullscreen exited unexpectedly. Auto-submitting quiz.");
                document.getElementById('fullscreen-container').style.display = 'none';
                document.getElementById('question-palette').style.display = 'none';

                const modal = document.getElementById('modal');
                if (modal) {
                    modal.style.display = 'none';
                }

                document.getElementById('result-container').style.display = 'block';
                displayResults();
            }
        }
    });


    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            document.removeEventListener('mousemove', moveAt);
        }
    });

    function moveAt(e) {
        if (isDragging) {
            const newLeft = e.clientX - offsetX;
            const newTop = e.clientY - offsetY;
            calcContainer.style.left = newLeft + 'px';
            calcContainer.style.top = newTop + 'px';
        }
    }

    function initializeSubjectData() {
        const questionElements = document.querySelectorAll('.question');
        questionElements.forEach((question, index) => {
            const subject = question.getAttribute('data-subject');
            if (!subjectData[subject]) {
                subjectData[subject] = {
                    markedForReview: new Set(),
                    answeredQuestions: new Set(),
                    correct: 0,
                    wrong: 0,
                    unattempted: 0,
                    score: 0,
                    totalQuestions: 0
                };
            }
            if (!question.dataset.id) {
                question.dataset.id = `${subject}-Q${index + 1}`;
            }
            if (!timeTakenArray[subject]) timeTakenArray[subject] = {};
            subjectData[subject].totalQuestions++;
        });
    }

    document.getElementById('start-button').onclick = function() {
        document.getElementById('start-page').style.display = 'none';
        document.getElementById('fullscreen-container').style.display = 'block';
        startQuiz();
    };

    let userAnswers = {}; // { questionId: { type, value } }


    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function startQuiz() {
        initializeSubjectData();

        const firstQuestion = document.querySelector('.question');
        if (firstQuestion) {
            const firstSubject = firstQuestion.getAttribute('data-subject');
            showSubject(firstSubject);
        }

        questionStartTimes[currentQuestionIndex] = Date.now();
        startCountdown();

        const fullscreenContainer = document.getElementById('fullscreen-container');
        fullscreenContainer.requestFullscreen();

        document.addEventListener('keydown', e => e.preventDefault());
        document.addEventListener('contextmenu', e => e.preventDefault());

        if (window.matchMedia("(orientation: portrait)").matches) {
            screen.orientation.lock("landscape").catch(console.error);
        }
    }


    function showSubject(subject) {
        currentSubject = subject;

        if (!subjectData[subject]) {
            subjectData[subject] = {
                answeredQuestions: new Set(),
                markedForReview: new Set()
            };
        }

        const allQuestions = Array.from(document.querySelectorAll(`.question[data-subject="${subject}"]`));
        questions = shuffleArray(allQuestions); // Keeps question shuffling
        shuffledOrderPerSubject[subject] = questions.map(q => q.dataset.id);

        // questions.forEach((question) => {
        //     // ❌ Removed option shuffling here
        //     const optionsContainer = question.querySelector('.options');
        //     if (optionsContainer && !question.hasAttribute('data-options-shuffled')) {
        //         // We just mark as shuffled to prevent any future shuffle attempts
        //         question.setAttribute('data-options-shuffled', 'true');
        //     }

        //     if (!question.hasAttribute('data-original-content')) {
        //         question.setAttribute('data-original-content', question.innerHTML);
        //     }
        // });

        // Hide all other questions
        document.querySelectorAll('.question').forEach(q => q.style.display = 'none');

        currentQuestionIndex = 0;
        updateQuestionDisplay();
        updateFooterButtons();
        updateQuestionPalette();
        questionStartTimes[currentQuestionIndex] = Date.now();
    }

    // function updateQuestionDisplay() {
    //     document.querySelectorAll('.question').forEach(q => q.style.display = 'none');

    //     const currentQuestion = questions[currentQuestionIndex];
    //     currentQuestion.style.display = 'block';

    //     const type = currentQuestion.dataset.type;
    //     const questionId = currentQuestion.dataset.id;

    //     if (type === 'NAT') {
    //         document.getElementById('numeric-keypad').style.display = 'block';
    //     } else {
    //         document.getElementById('numeric-keypad').style.display = 'none';
    //     }

    //     const baseContent = currentQuestion.getAttribute('data-original-content');
    //     const indexText = `<div style="font-weight:bold; margin-bottom:5px; font-size:14px;">Question ${currentQuestionIndex + 1}</div>`;
    //     currentQuestion.innerHTML = indexText + baseContent;

    //     const stored = userAnswers[questionId];
    //     if (stored) {
    //         if (type === "MCQ") {
    //             currentQuestion.querySelectorAll('input[type="radio"]').forEach(input => {
    //                 input.checked = input.value === stored.value;
    //             });
    //         } else if (type === "MSQ") {
    //             currentQuestion.querySelectorAll('input[type="checkbox"]').forEach(input => {
    //                 input.checked = stored.value.includes(input.value);
    //             });
    //         } else if (type === "NAT") {
    //             const input = currentQuestion.querySelector('input[type="text"], input[type="number"]');
    //             if (input) input.value = stored.value;
    //         }
    //     }
    // }

    function updateQuestionDisplay() {
        document.querySelectorAll('.question').forEach((question) => {
            question.style.display = 'none';
        });
        if (questions.length > 0) {
            questions[currentQuestionIndex].style.display = 'block';
            if (questions[currentQuestionIndex].getAttribute('data-type') === 'NAT') {
                document.getElementById('numeric-keypad').style.display = 'block';
            } else {
                document.getElementById('numeric-keypad').style.display = 'none';
            }
        }
    }


    function updateFooterButtons() {
        document.getElementById('prev').style.display = currentQuestionIndex === 0 ? 'none' : 'inline';
        document.getElementById('next').style.display = currentQuestionIndex === questions.length - 1 ? 'none' : 'inline';
        document.getElementById('footer_buttons').style.display = questions.length > 0 ? 'block' : 'none';
    }

    document.getElementById('prev').onclick = () => {
        if (currentQuestionIndex > 0) {
            recordTimeTaken();
            handleQuestionStateBeforeChange();
            currentQuestionIndex--;
            updateQuestionDisplay();
            updateFooterButtons();
            updateQuestionPalette();
            questionStartTimes[currentQuestionIndex] = Date.now();
        }
    };

    document.getElementById('next').onclick = () => {
        if (currentQuestionIndex < questions.length - 1) {
            recordTimeTaken();
            handleQuestionStateBeforeChange();
            currentQuestionIndex++;
            updateQuestionDisplay();
            updateFooterButtons();
            updateQuestionPalette();
            questionStartTimes[currentQuestionIndex] = Date.now();
        }
    };

    document.getElementById('clear').onclick = () => {
        const currentQuestion = questions[currentQuestionIndex];
        const questionId = currentQuestion.dataset.id;
        currentQuestion.querySelectorAll('input:checked').forEach(input => input.checked = false);
        delete userAnswers[questionId];
        subjectData[currentSubject].answeredQuestions.delete(questionId);
        updateQuestionPalette();
    };

    document.getElementById('mark-for-review').onclick = () => {
        const currentQuestion = questions[currentQuestionIndex];
        const questionId = currentQuestion.dataset.id;
        const userAnswer = getUserAnswer(currentQuestion);

        const reviewSet = subjectData[currentSubject].markedForReview;
        if (reviewSet.has(questionId)) {
            reviewSet.delete(questionId);
        } else {
            reviewSet.add(questionId);
        }

        if (userAnswer) {
            subjectData[currentSubject].answeredQuestions.add(questionId);
        } else {
            subjectData[currentSubject].answeredQuestions.delete(questionId);
        }

        updateQuestionPalette();
    };

    function getUserAnswer(questionElement) {
        const type = questionElement.dataset.type;

        if (type === "MCQ") {
            const selected = questionElement.querySelector('input[type="radio"]:checked');
            return selected ? selected.value : null;
        } else if (type === "MSQ") {
            const selected = questionElement.querySelectorAll('input[type="checkbox"]:checked');
            return Array.from(selected).map(input => input.value);
        } else if (type === "NAT") {
            const input = questionElement.querySelector('input[type="text"], input[type="number"]');
            return input ? input.value.trim() : null;
        }

        return null;
    }

    function handleQuestionStateBeforeChange() {
        const currentQuestion = questions[currentQuestionIndex];
        const questionId = currentQuestion.dataset.id;
        const type = currentQuestion.dataset.type;
        const userAnswer = getUserAnswer(currentQuestion);

        if (userAnswer && !(Array.isArray(userAnswer) && userAnswer.length === 0)) {
            userAnswers[questionId] = {
                type,
                value: userAnswer
            };
            subjectData[currentSubject].answeredQuestions.add(questionId);
        } else {
            delete userAnswers[questionId];
            subjectData[currentSubject].answeredQuestions.delete(questionId);
        }

        markAsSeen(currentQuestionIndex);
    }

    function recordTimeTaken() {
        const questionEndTime = Date.now();
        const questionStartTime = questionStartTimes[currentQuestionIndex];
        const timeTaken = (questionEndTime - questionStartTime) / 1000;
        const questionId = questions[currentQuestionIndex]?.dataset?.id;

        if (!timeTakenArray[currentSubject]) timeTakenArray[currentSubject] = {};
        if (!timeTakenArray[currentSubject][questionId]) timeTakenArray[currentSubject][questionId] = 0;
        timeTakenArray[currentSubject][questionId] += timeTaken;

        questionStartTimes[currentQuestionIndex] = questionEndTime;
    }

    function updateQuestionPalette() {
        const palette = document.getElementById('question-palette');
        palette.innerHTML = '';
        const heading = document.createElement('h3');
        heading.textContent = `${currentSubject} Questions`;
        palette.appendChild(heading);

        questions.forEach((question, index) => {
            const button = document.createElement('button');
            const questionId = question.dataset.id;

            button.textContent = index + 1;
            button.classList.toggle('active', index === currentQuestionIndex);

            const marks = subjectData[currentSubject].markedForReview;
            const answered = subjectData[currentSubject].answeredQuestions;

            if (marks.has(questionId) && answered.has(questionId)) {
                button.classList.add('purple-dot');
                button.style.backgroundColor = 'purple';
            } else if (answered.has(questionId)) {
                button.style.backgroundColor = 'green';
            } else if (marks.has(questionId)) {
                button.style.backgroundColor = 'purple';
            } else if (question.seen) {
                button.style.backgroundColor = 'red';
            } else {
                button.style.backgroundColor = 'black';
            }

            button.onclick = () => {
                recordTimeTaken();
                handleQuestionStateBeforeChange();
                currentQuestionIndex = index;
                updateQuestionDisplay();
                updateFooterButtons();
                updateQuestionPalette();
                questionStartTimes[currentQuestionIndex] = Date.now();
            };

            palette.appendChild(button);
        });

        updateQuestionStats();
    }

    function updateQuestionStats() {
        const buttons = Array.from(document.querySelectorAll('#question-palette button'));

        const answeredCount = buttons.filter(b => b.style.backgroundColor === 'green').length;
        const answeredMarkedCount = buttons.filter(b => b.classList.contains('purple-dot')).length;
        const markedCount = buttons.filter(b => b.style.backgroundColor === 'purple' && !b.classList.contains('purple-dot')).length;
        const notVisitedCount = buttons.filter(b => b.style.backgroundColor === 'black').length;
        const unansweredCount = buttons.filter(b => b.style.backgroundColor === 'red').length;

        document.getElementById('answered-count').textContent = answeredCount;
        document.getElementById('unanswered-count').textContent = unansweredCount;
        document.getElementById('review-count').textContent = markedCount;
        document.getElementById('answered-review-count').textContent = answeredMarkedCount;
        document.getElementById('not-visited-count').textContent = notVisitedCount;
    }

    function markAsSeen(index) {
        questions[index].seen = true;
    }

    document.getElementById('submit').onclick = function() {
        console.log("Submit button clicked!");
        recordTimeTaken();

        isAwaitingConfirmation = true; // User clicked submit, waiting for confirm

        const modal = document.getElementById('myModal');
        modal.style.display = 'block';

        // Exit fullscreen early
        const exitFullScreen =
            document.exitFullscreen ||
            document.mozCancelFullScreen ||
            document.webkitExitFullscreen ||
            document.msExitFullscreen;

        if (exitFullScreen) {
            exitFullScreen.call(document);
            console.log("Exited fullscreen.");
        }

        document.getElementById('confirmSubmit').onclick = function() {
            console.log("Confirm submit clicked!");
            hasConfirmedSubmit = true;
            isAwaitingConfirmation = false; // No longer awaiting

            // Hide quiz elements
            document.getElementById('fullscreen-container').style.display = 'none';
            document.getElementById('question-palette').style.display = 'none';
            modal.style.display = 'none';
            document.getElementById('result-container').style.display = 'block';
            displayResults();

            // Show Ad Modal
            const adModal = document.getElementById('adModal');
            const adCloseButton = document.getElementById('adClose');

            if (adModal) {
                adModal.style.display = 'none';

                setTimeout(() => {
                    if (adCloseButton) {
                        adCloseButton.style.display = 'inline';
                    }
                }, 5000);

                if (adCloseButton) {
                    adCloseButton.onclick = function() {
                        adModal.style.display = 'none';
                        document.getElementById('result-container').style.display = 'block';
                        displayResults();
                    };
                }

                setTimeout(() => {
                    if (adModal.style.display !== 'none') {
                        adModal.style.display = 'none';
                        document.getElementById('result-container').style.display = 'block';
                        showResult();
                    }
                }, 10000);
            }

            clearInterval(timerInterval);
        };

        document.getElementById('cancelSubmit').onclick = function() {
            console.log("Cancel submit clicked! Closing modal.");
            modal.style.display = 'none';

            isAwaitingConfirmation = false; // Cancel confirmation

            const fullscreenContainer = document.getElementById('fullscreen-container');
            if (fullscreenContainer.requestFullscreen) {
                fullscreenContainer.requestFullscreen();
            }

            if (window.matchMedia("(orientation: portrait)").matches) {
                screen.orientation.lock("landscape").catch(function(error) {
                    console.error("Orientation lock failed: ", error);
                });
            }
        };
    };

    function displayResults() {
        document.getElementById('result-container').style.display = 'block';
        document.getElementById('user-name-display').innerText = userName;
        showResult();
        // window.location.href = './results.html'; 
    }


    function startCountdown() {
        targetTime = Date.now() + countdownSeconds * 1000;
        updateTimerDisplay();

        timerInterval = setInterval(() => {
            if (Date.now() >= targetTime) {
                clearInterval(timerInterval);
                document.getElementById('timer').textContent = "Time's Up!";

                // DIRECTLY submit the quiz when time is up
                recordTimeTaken();

                // Hide quiz elements
                document.getElementById('fullscreen-container').style.display = 'none';
                document.getElementById('question-palette').style.display = 'none';
                document.getElementById('result-container').style.display = 'block';

                // Display results immediately
                displayResults();

                // Exit fullscreen if needed
                const exitFullScreen =
                    document.exitFullscreen ||
                    document.mozCancelFullScreen ||
                    document.webkitExitFullscreen ||
                    document.msExitFullscreen;

                if (exitFullScreen) {
                    exitFullScreen.call(document);
                }
            } else {
                updateTimerDisplay();
            }
        }, 1000);
    }

    function updateTimerDisplay() {
        const remainingTime = targetTime - Date.now();
        const minutes = Math.floor(remainingTime / 60000);
        const seconds = Math.floor((remainingTime % 60000) / 1000);
        document.getElementById('timer').textContent = `${minutes}m ${seconds}s`;
        if (remainingTime < 600000) {
            document.getElementById('timer').style.color = 'red';
        } else {
            document.getElementById('timer').style.color = '';
        }
    }

    function validateUserAnswer(userAnswer, correctAnswer, precision, min, max) {
        const userAnswerNum = parseFloat(userAnswer);
        const userDecimals = (userAnswer.split('.')[1] || '').length;
        const isInRange = userAnswerNum >= min && userAnswerNum <= max;

        // Check if the answer has the correct number of decimal places
        const isCorrectPrecision = userDecimals === precision;

        return isInRange && isCorrectPrecision;
    }

    function getUserAnswer(question) {
        const radioChecked = Array.from(question.querySelectorAll('input[type="radio"]:checked')).map(input => input.value);
        const checkboxChecked = Array.from(question.querySelectorAll('input[type="checkbox"]:checked')).map(input => input.value);
        const textInput = Array.from(question.querySelectorAll('input[type="number"]')).map(input => input.value.trim());
        return [...radioChecked, ...checkboxChecked, ...textInput.filter(value => value !== '')].sort().join(';');
    }

    function addToInput(value) {
        // Get the current question's input field
        const inputField = questions[currentQuestionIndex].querySelector('input[type="number"]');
        if (inputField) {
            inputField.value += value; // Append the value to the current input field
        }
    }

    function clearInput() {
        // Get the current question's input field
        const inputField = questions[currentQuestionIndex].querySelector('input[type="number"]');
        if (inputField) {
            inputField.value = ''; // Clear the current input field
        }
    }

    function toggleSign() {
        // Get the current question's input field
        const inputField = questions[currentQuestionIndex].querySelector('input[type="number"]');
        if (inputField) {
            if (inputField.value.startsWith('-')) {
                inputField.value = inputField.value.substring(1); // Remove the negative sign
            } else {
                inputField.value = '-' + inputField.value; // Add the negative sign
            }
        }
    }

    document.getElementById('restart').addEventListener('click', function() {
        // Reset quiz state
        currentQuestionIndex = 0;
        subjectData = {};
        timeTakenArray = {};

        // Show quiz
        document.getElementById('question-palette').style.display = 'block';

        // Call the function to start the quiz
        startQuiz();
    });

    function showResult() {
        const subjects = {};
        const questions = document.querySelectorAll('.question');

        const userName = document.getElementById('user-name')?.value || 'Anonymous';
        const userNameDisplay = document.getElementById('user-display');
        if (userNameDisplay) userNameDisplay.textContent = userName;

        // ✅ Extract only real question content (ignore metadata/marks)
        function extractQuestionContent(question) {
            let htmlContent = '';

            const tagsToInclude = ['p', 'pre', 'code', 'img', 'table', 'span'];
            tagsToInclude.forEach(tag => {
                const elements = question.querySelectorAll(tag);

                elements.forEach(el => {
                    const className = el.className || '';
                    const style = el.getAttribute('style') || '';
                    const text = el.textContent.trim();

                    // ❌ Skip metadata and mark spans
                    if (
                        className.includes('question-type') ||
                        className.includes('question-marks') ||
                        (tag === 'span' && (
                            style.includes('color: green') ||
                            style.includes('color: red') ||
                            /^[\d.\-+]+$/.test(text) // matches numbers like 1, -0.33
                        ))
                    ) {
                        return; // skip this element
                    }

                    htmlContent += el.outerHTML;
                });
            });

            // ✅ Add plain text nodes not inside tags
            question.childNodes.forEach(node => {
                if (node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '') {
                    htmlContent += `<p>${node.textContent.trim()}</p>`;
                }
            });

            return htmlContent.trim();
        }

        questions.forEach((question, i) => {
            const subject = question.getAttribute('data-subject');
            if (!subjects[subject]) {
                subjects[subject] = {
                    correct: 0,
                    wrong: 0,
                    unattempted: 0,
                    score: 0,
                    totalCorrectScore: 0,
                    timeSpent: [],
                    time: 0,
                    questions: [],
                };
            }

            const questionType = question.getAttribute('data-type');
            const correctAnswer = question.getAttribute('data-answer')?.split(';').sort().join(';');
            const userAnswer = getUserAnswer(question);
            const explanation = question.getAttribute('data-explanation') || "No explanation available.";

            const questionText = extractQuestionContent(question);

            const optionElements = question.querySelectorAll('.options div label');
            const options = Array.from(optionElements).map(label => label.innerHTML.trim());

            const questionDetail = {
                questionText,
                userAnswer: userAnswer || 'Not answered',
                correctAnswer,
                result: 'Wrong', // Will be updated
                type: questionType,
                correctScore: parseFloat(question.getAttribute('data-correct-score')),
                incorrectScore: parseFloat(question.getAttribute('data-incorrect-score')),
                options,
                question,
                explanation
            };

            evaluateAnswer(questionDetail, userAnswer, correctAnswer, questionType, subjects[subject]);
            subjects[subject].questions.push(questionDetail);

            const timeForThisQuestion = timeTakenArray[subject]?.[i] || 0;
            subjects[subject].timeSpent.push(timeForThisQuestion);
            subjects[subject].time += timeForThisQuestion;
            subjects[subject].totalCorrectScore += questionDetail.correctScore;
        });

        // ✅ Final rendering functions
        displayDetailedResults(subjects);
        displayDetailed(subjects);
        renderTimeSpentChart(subjects);
        checkUserPerformance(subjects);
        sendResultsToSheet(subjects, userName);
    }

    function displayDetailedResults(subjects) {
        const resultBody = document.getElementById('result-body');
        resultBody.innerHTML = '';

        let totalmarks = 0;
        let totalScore = 0;
        let totalCorrect = 0;
        let totalWrong = 0;
        let totalUnattempted = 0;
        let totalTimeSpent = 0;

        for (const subject in subjects) {
            const subjectResult = subjects[subject];
            let subjectTimeSpent = 0;

            subjectResult.questions.forEach((question, index) => {
                const qId = question.id || `${subject}-Q${index + 1}`;
                const timeSpent = timeTakenArray[subject]?.[qId] || 0;
                subjectTimeSpent += timeSpent;
            });

            totalScore += subjectResult.score;
            totalCorrect += subjectResult.correct;
            totalWrong += subjectResult.wrong;
            totalUnattempted += subjectResult.unattempted;
            totalmarks += subjectResult.totalCorrectScore;
            totalTimeSpent += subjectTimeSpent;

            const subjectMinutes = Math.floor(subjectTimeSpent / 60);
            const subjectSeconds = Math.floor(subjectTimeSpent % 60).toString().padStart(2, '0');

            resultBody.innerHTML += `
            <tr class="category-row">
                <td style="font-weight: bold;">${subject}</td>
                <td>${subjectResult.score.toFixed(2)}</td>
                <td>${subjectMinutes.toString().padStart(2, '0')} min:${subjectSeconds} sec</td>
                <td>${subjectResult.correct}</td>
                <td>${subjectResult.wrong}</td>
                <td>${subjectResult.unattempted}</td>
            </tr>`;
        }

        const totalMinutes = Math.floor(totalTimeSpent / 60);
        const totalSeconds = Math.floor(totalTimeSpent % 60).toString().padStart(2, '0');

        resultBody.innerHTML += `
        <tr class="total-row">
            <td style="font-weight: bold;">Total</td>
            <td>${totalScore.toFixed(2)}</td>
            <td>${totalMinutes.toString().padStart(2, '0')} min:${totalSeconds} sec</td>
            <td>${totalCorrect}</td>
            <td>${totalWrong}</td>
            <td>${totalUnattempted}</td>
        </tr>`;

        const totalData = {
            user: user,
            subject: titlequiz,
            score: totalScore.toFixed(2),
            time: `${totalMinutes.toString().padStart(2, '0')} min : ${totalSeconds.toString().padStart(2, '0')} sec`,
            correct: totalCorrect,
            wrong: totalWrong,
            unattempted: totalUnattempted,
            totalMarks: totalmarks.toFixed(2)
        };

        // Send data to Google Apps Script
        fetch(' https://script.google.com/macros/s/AKfycbw2QW10V2vkaYQC9jyom1R0iNpseWMqJasCeZUCvSWBhQmPIfrQbrdxs9R-s4AmKpRhdQ/exec', {
            method: 'POST',
            mode: 'no-cors', // Use 'cors' if handling response
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(totalData)
        });

    }

    function checkUserPerformance(subjects) {
        let totalScore = 0;
        let totalMarks = 0;
        for (const subject in subjects) {
            totalScore += subjects[subject].score;
            totalMarks += subjects[subject].totalCorrectScore;
        }
        const percentage = (totalScore / totalMarks) * 100;

        let message = '';
        if (percentage > 60) {
            message = `🎉🎈 Congratulations, ${userName}, You got ${percentage} % Marks 🎈🎉`;
            showWinnerAnimation(message);
        } else if (percentage >= 30) {
            message = `🎉🎈 Congratulations, ${userName}, You got ${percentage} % Marks 🎈🎉`;
            showFeedbackMessage(message);
        } else {
            message = `🎉🎈 Congratulations, ${userName}, You got ${percentage} % Marks 🎈🎉`;
            showFeedbackMessage(message);
        }
    }

    function showWinnerAnimation(message) {
        const winnerMessage = document.createElement('div');
        winnerMessage.innerHTML = `<h1 style="color: green;">${message}</h1>`;
        winnerMessage.style.position = 'fixed';
        winnerMessage.style.top = '50%';
        winnerMessage.style.left = '50%';
        winnerMessage.style.transform = 'translate(-50%, -50%)';
        winnerMessage.style.zIndex = '1000';
        winnerMessage.style.fontSize = '14px';
        winnerMessage.style.textAlign = 'center';
        document.body.appendChild(winnerMessage);

        // Animation effect
        winnerMessage.animate([{
                transform: 'scale(1)',
                opacity: 1
            },
            {
                transform: 'scale(1.1)',
                opacity: 1
            },
            {
                transform: 'scale(1)',
                opacity: 1
            }
        ], {
            duration: 1000,
            iterations: 3
        });

        // Remove the message after a few seconds
        setTimeout(() => {
            document.body.removeChild(winnerMessage);
        }, 10000);
    }

    function showFeedbackMessage(message) {
        const feedbackMessage = document.createElement('div');
        feedbackMessage.innerHTML = `<h1 style="color: red;">${message}</h1>`;
        feedbackMessage.style.position = 'fixed';
        feedbackMessage.style.top = '50%';
        feedbackMessage.style.left = '50%';
        feedbackMessage.style.transform = 'translate(-50%, -50%)';
        feedbackMessage.style.zIndex = '1000';
        feedbackMessage.style.fontSize = '2em';
        feedbackMessage.style.textAlign = 'center';
        document.body.appendChild(feedbackMessage);

        // Remove the message after a few seconds
        setTimeout(() => {
            document.body.removeChild(feedbackMessage);
        }, 5000);
    }

    function evaluateAnswer(questionDetail, userAnswer, correctAnswer, questionType, subjectStats) {
        if (questionType === 'NAT') {
            const dataMin = parseFloat(questionDetail.question.getAttribute('data-min')) || null;
            const dataMax = parseFloat(questionDetail.question.getAttribute('data-max')) || null;
            const precision = parseInt(questionDetail.question.getAttribute('data-precision')) || 0;

            if (validateUserAnswer(userAnswer, correctAnswer, precision, dataMin, dataMax)) {
                questionDetail.result = 'Correct';
                subjectStats.correct++;
                subjectStats.score += questionDetail.correctScore;
            } else if (!userAnswer) {
                questionDetail.result = 'Unattempted';
                subjectStats.unattempted++;
            } else {
                questionDetail.result = 'Wrong';
                subjectStats.wrong++;
                subjectStats.score += questionDetail.incorrectScore;
            }

            // Set the correct answer to be the range between dataMin and dataMax
            questionDetail.correctAnswer = `${dataMin} - ${dataMax}`;
        } else if (questionType === 'MCQ') {
            if (userAnswer === correctAnswer) {
                questionDetail.result = 'Correct';
                subjectStats.correct++;
                subjectStats.score += questionDetail.correctScore;
            } else if (!userAnswer) {
                questionDetail.result = 'Unattempted';
                subjectStats.unattempted++;
            } else {
                questionDetail.result = 'Wrong';
                subjectStats.wrong++;
                subjectStats.score += questionDetail.incorrectScore;
            }
        } else if (questionType === 'MSQ') {
            const correctArray = (correctAnswer || '').split(',').map(a => a.trim()).sort();
            const correctKey = correctArray.join(';');

            const userArray = (userAnswer || '').split(';').map(a => a.trim()).filter(Boolean).sort();
            const userKey = userArray.join(';');

            if (!userAnswer || userArray.length === 0) {
                questionDetail.result = 'Unattempted';
                subjectStats.unattempted++;
            } else if (userKey === correctKey) {
                questionDetail.result = 'Correct';
                subjectStats.correct++;
                subjectStats.score += parseFloat(questionDetail.correctScore);
            } else {
                questionDetail.result = 'Wrong';
                subjectStats.wrong++;
                subjectStats.score += parseFloat(questionDetail.incorrectScore);
            }

            // For displaying correctAnswer in "A, B, C" format
            questionDetail.correctAnswer = correctArray.join(', ');
        }

    }

    function displayDetailed(subjects) {
        const detailedResultsContainer = document.getElementById('detailed-results');
        detailedResultsContainer.innerHTML = '';

        for (const subject in subjects) {
            const subjectReport = subjects[subject];
            const subjectDiv = document.createElement('div');
            subjectDiv.innerHTML = `<h3>${subject}</h3><ul>`;

            let totalScore = 0;

            const rawQuestions = subjectReport.questions;

            // Ensure all questions have IDs
            rawQuestions.forEach((q, i) => {
                if (!q.id) q.id = `${subject}-Q${i + 1}`;
            });

            const order = shuffledOrderPerSubject[subject] || rawQuestions.map(q => q.id);

            order.forEach((qid, index) => {
                const questionDetail = rawQuestions.find(q => q.id === qid);
                if (!questionDetail) return;

                const questionType = questionDetail.type;

                // Get the actual DOM elements
                const optionDivs = questionDetail.question.querySelectorAll('.options > div');
                const idToLabelText = {};
                const valueToLabelText = {};

                optionDivs.forEach(div => {
                    const input = div.querySelector('input');
                    const label = div.querySelector('label');
                    if (input && label) {
                        idToLabelText[input.id] = label.innerText.trim();
                        valueToLabelText[input.value] = label.innerText.trim();
                    }
                });

                // Convert answer values to label text
                function answersToLabels(answers) {
                    if (!answers) return 'Not answered';
                    const answerArr = Array.isArray(answers) ? answers : answers.split(';');
                    return answerArr.map(ans => valueToLabelText[ans] || ans).join(', ');
                }

                const userAnswerRaw = questionDetail.userAnswer || 'Not answered';
                const correctAnswerRaw = questionDetail.correctAnswer || 'Not answered';

                const userAnswerLabel = questionType === 'NAT' ?
                    userAnswerRaw :
                    answersToLabels(userAnswerRaw);

                const correctAnswerLabel = questionType === 'NAT' ?
                    correctAnswerRaw :
                    answersToLabels(correctAnswerRaw);

                // Clean LaTeX
                let cleanCorrectAnswer = correctAnswerLabel;
                if (typeof cleanCorrectAnswer === 'string' && /\\/.test(cleanCorrectAnswer)) {
                    cleanCorrectAnswer = cleanCorrectAnswer
                        .replace(/\\\(|\\\)|\\\[|\\\]/g, '')
                        .replace(/\\frac{([^}]+)}{([^}]+)}/g, '$1/$2')
                        .replace(/\\sqrt{([^}]+)}/g, '√($1)')
                        .replace(/\\int/g, '∫')
                        .replace(/\\sum/g, '∑')
                        .replace(/\\cdot/g, '·')
                        .replace(/\\times/g, '×')
                        .replace(/[{}]/g, '')
                        .replace(/^\\\((.*)\\\)$/, '$1')
                        .replace(/^\\\[(.*)\\\]$/, '$1')
                        .trim();
                }

                const isCorrect = questionDetail.result === 'Correct';

                // Determine result style
                const resultSymbol = isCorrect ? '✅' : userAnswerRaw === 'Not answered' ? '❓' : '❌';
                const backgroundClass = isCorrect ? 'correct-answer' : userAnswerRaw === 'Not answered' ? 'not-answered' : 'wrong-answer';

                // Options HTML for rendering
                let optionsHTML = '';
                if (questionType === 'MCQ') {
                    optionsHTML = '<div>';
                    optionDivs.forEach(div => {
                        const input = div.querySelector('input');
                        const label = div.querySelector('label');
                        if (input && label) {
                            const checked = userAnswerRaw === input.value ? 'checked' : '';
                            optionsHTML += `
                    <div>
                        <label>
                            <input type="radio" disabled ${checked}> ${label.innerText.trim()}
                        </label>
                    </div>
                `;
                        }
                    });
                    optionsHTML += '</div>';
                } else if (questionType === 'MSQ') {
                    const userAnswers = Array.isArray(userAnswerRaw) ?
                        userAnswerRaw :
                        userAnswerRaw.split(';');
                    optionsHTML = '<div>';
                    optionDivs.forEach(div => {
                        const input = div.querySelector('input');
                        const label = div.querySelector('label');
                        if (input && label) {
                            const checked = userAnswers.includes(input.value) ? 'checked' : '';
                            optionsHTML += `
                    <div>
                        <label>
                            <input type="checkbox" disabled ${checked}> ${label.innerText.trim()}
                        </label>
                    </div>
                `;
                        }
                    });
                    optionsHTML += '</div>';
                } else if (questionType === 'NAT') {
                    optionsHTML = `<strong>Your Input:</strong> ${userAnswerLabel || 'Not answered'}<br>`;
                }

                // Time formatting
                const qId = questionDetail.id || `${subject}-Q${index + 1}`;
                let rawTime = (timeTakenArray?.[subject]?.[qId]) || 0;
                rawTime = Number(rawTime);
                if (isNaN(rawTime)) rawTime = 0;
                const mins = Math.floor(rawTime / 60);
                const secs = Math.floor(rawTime % 60);
                const timeTaken = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
                let timeColor = 'gray';
                if (rawTime < 60) timeColor = 'green';
                else if (rawTime <= 180) timeColor = 'orange';
                else timeColor = 'red';

                const questionHTML = `
        <div class="question-result ${backgroundClass}" style="position: relative; padding: 10px; border: 1px solid #ccc; border-radius: 8px; margin-bottom: 20px;">
            <div style=" position: absolute; top: 10px; right: 10px; background: #fff; color: ${timeColor}; padding: 4px 8px; border-radius: 6px; font-weight: 500; font-size: 13px; font-family: 'Segoe UI', sans-serif; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15); display: flex; align-items: center; gap: 6px; ">
                <span style="font-size: 16px;">⏱️</span>
                <span>${timeTaken} sec</span>
            </div>

            <div class="question-meta">
                <strong>Question ${index + 1})</strong><br>
                <strong>Question Type:</strong> ${questionType}<br>
                <strong>Positive Marks:</strong> <span style="color: green">${questionDetail.correctScore}</span> |
                <strong>Negative Marks:</strong> <span style="color: red">${questionDetail.incorrectScore}</span>
            </div>

            <div class="question-text" style="margin-top: 10px;">
                ${questionDetail.questionText}
            </div>

            <div class="options-section" style="margin-top: 10px;">
                ${optionsHTML}
            </div>

            <div class="angled-text">AERO GATE TOPPER</div>

            <div class="answer-section" style="margin-top: 10px;">
                <strong>Your Answer:</strong> ${userAnswerLabel}<br>
                <strong>Correct Answer:</strong> ${cleanCorrectAnswer}<br>
                <strong>Result:</strong> ${resultSymbol} ${questionDetail.result}<br>
                <strong>Explanation:</strong><br> ${questionDetail.explanation || 'No explanation'}<br><br>
            </div>
        </div>
    `;

                subjectDiv.insertAdjacentHTML('beforeend', questionHTML);

                // Score calculation
                const correctAnswers = typeof questionDetail.correctAnswer === 'string' ?
                    questionDetail.correctAnswer.split(';') : [];
                const userAnswers = typeof questionDetail.userAnswer === 'string' ?
                    questionDetail.userAnswer.split(';') : [];

                const isFullyCorrect = correctAnswers.length === userAnswers.length &&
                    correctAnswers.every(ans => userAnswers.includes(ans));

                if (isCorrect || isFullyCorrect) {
                    totalScore += parseFloat(questionDetail.correctScore);
                } else if (userAnswers.length > 0) {
                    totalScore += parseFloat(questionDetail.incorrectScore);
                }
            });
            detailedResultsContainer.appendChild(subjectDiv);
        }

        if (typeof MathJax !== 'undefined') {
            MathJax.typesetPromise();
        }
    }

    function renderTimeSpentChart(subjects) {
        const labels = [];
        const data = [];

        // Collect data for the chart
        for (const subject in subjects) {
            subjects[subject].questions.forEach((questionDetail, index) => {
                const timeSpent = timeTakenArray[subject][index] || 0;
                let shortSubject = subject.match(/\(([^)]+)\)/)?.[1] || subject;

                labels.push(`${shortSubject} - Q${index + 1} (${questionDetail.result})`); // Format label as "SubjectName - Q1"
                data.push(timeSpent);
            });
        }

        const ctx = document.getElementById('timeSpentChart').getContext('2d');
        const timeSpentChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Time Spent (seconds)',
                    data: data,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Add event listeners for buttons            
    document.getElementById('start-button').onclick = startQuiz;
    document.getElementById('prev').onclick = prevQuestion;
    document.getElementById('next').onclick = nextQuestion;
    document.getElementById('clear').onclick = clearResponse;
    document.getElementById('submit').onclick = submitQuiz;
    document.getElementById('mark-for-review').onclick = markForReview;
</script>
<!-- Ads apply on Result -->
<script>
    const adSlots = [
        '8494063499', // Replace with your real slot IDs
        '3583150613',
        '5941720643',
        '5484208038',
        '3020043832'
    ];

    function createAdBlock(slotId) {
        const ad = document.createElement('ins');
        ad.className = 'adsbygoogle';
        ad.style.display = 'block';
        ad.style.textAlign = 'center';
        ad.setAttribute('data-ad-client', 'ca-pub-2922315402866630');
        ad.setAttribute('data-ad-slot', slotId);
        ad.setAttribute('data-ad-format', 'fluid');
        ad.setAttribute('data-ad-layout', 'in-article');
        return ad;
    }

    function insertRandomAds(containerId, adSlotArray) {
        const container = document.getElementById(containerId);
        const children = Array.from(container.children);
        const positions = new Set();

        while (positions.size < adSlotArray.length) {
            let pos = Math.floor(Math.random() * (children.length + 1));
            positions.add(pos);
        }

        const sortedPositions = Array.from(positions).sort((a, b) => b - a);

        sortedPositions.forEach((pos, index) => {
            const ad = createAdBlock(adSlotArray[index]);
            if (pos >= children.length) {
                container.appendChild(ad);
            } else {
                container.insertBefore(ad, children[pos]);
            }
            (adsbygoogle = window.adsbygoogle || []).push({});
        });
    }

    window.addEventListener('load', function() {
        insertRandomAds("result-container", adSlots);
    });
</script>
