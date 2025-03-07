// Prevent duplicate injections
if (!document.getElementById("chatbot-container")) {
    // Create chatbot container
    const chatbotContainer = document.createElement("div");
    chatbotContainer.id = "chatbot-container";
    chatbotContainer.innerHTML = `
      <div id="chatbot-header">
            <span>AI Chatbot</span>
            <button id="close-chatbot">
            <svg class="close-chatbot-svg" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="15" height="15" viewBox="0,0,256,256">
<g fill="#ffffff" fill-rule="nonzero" stroke="none" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset="0" font-family="none" font-weight="none" font-size="none" text-anchor="none" style="mix-blend-mode: normal"><g transform="scale(5.12,5.12)"><path d="M7.71875,6.28125l-1.4375,1.4375l17.28125,17.28125l-17.28125,17.28125l1.4375,1.4375l17.28125,-17.28125l17.28125,17.28125l1.4375,-1.4375l-17.28125,-17.28125l17.28125,-17.28125l-1.4375,-1.4375l-17.28125,17.28125z"></path></g></g>
</svg>
</button>
        </div>
         <div id="error-message" class="error hidden"></div>
        <div id="chatbot-messages"></div>
         <div id="chatbot-input-container">
    <input type="text" id="chatbot-input" placeholder="Enter your text here..." />
    <button id="chatbot-send">
    <svg id="send-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 2L11 13"></path>
        <path d="M22 2L15 22L11 13L2 9L22 2Z"></path>
    </svg>
    <span id="spinner" class="spinner"></span>
</button>
</div>`;
    document.body.appendChild(chatbotContainer);

    // closing chat
    const closeChat = document.getElementById("close-chatbot");
    closeChat.addEventListener("click", () => {
        chatbotContainer.style.display = "none";
    });

    // Create floating button
    const chatbotButton = document.createElement("button");
    chatbotButton.id = "chatbot-btn";
    chatbotButton.innerText = "Use AI";
    document.body.appendChild(chatbotButton);

    // Apply gradient background
    chatbotContainer.style.background = "linear-gradient(to bottom, black, #4B0082, #8a2be2)";
    chatbotContainer.style.padding = "15px";
    chatbotContainer.style.borderRadius = "10px";
    chatbotContainer.style.color = "white";

    // Toggle chatbot visibility
    chatbotButton.addEventListener("click", () => {
        chatbotContainer.style.display = "block";
        chrome.runtime.sendMessage({ action: "open_popup" });
    });

    // Chat functionality
    const inputField = document.getElementById("chatbot-input");
    const sendButton = document.getElementById("chatbot-send");
    const messagesDiv = document.getElementById("chatbot-messages");

    // Extract problem ID from URL
    const problemId = window.location.pathname.match(/-(\d+)$/)?.[1];
    const storageKey = `chat_${problemId}`;
    let chatHistory = JSON.parse(localStorage.getItem(storageKey)) || [];

    // Load chat history
    chatHistory.forEach(({ sender, text }) => {
        const messageDiv = document.createElement("div");
        messageDiv.className = sender === "user" ? "message user-message" : "message bot-message";
        messageDiv.innerText = text;
        messagesDiv.appendChild(messageDiv);
    });

    function scrollToBottom() {
        const messagesDiv = document.getElementById("chatbot-messages");
        if (messagesDiv) {
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }
    }
    window.onload = scrollToBottom;

    let code;
    function getProblemValue() {
        let url = window.location.href;

        let match = url.match(/-(\d+)$/);
        if (!match) return null;
        let problemNumber = match[1];

        for (let i = 0; i < localStorage.length; i++) {
            let key = localStorage.key(i);

            if (key.endsWith(`_${problemNumber}_C++14`)) {
                code = localStorage.getItem(key);
                return localStorage.getItem(key);
            }
        }
        return null;
    }

    let problemValue = getProblemValue();
    // console.log(code);

    function extractDSAProblem() {
        let problemName_var = document.querySelector(".Header_resource_heading__cpRp1.rubik.fw-bold.mb-0.fs-4");
        let problemName = problemName_var.innerText;

        let description_var = document.querySelector(".coding_desc__pltWY.problem_paragraph");
        let description = description_var.querySelector(".undefined.markdown-renderer").innerText

        let Format_var = document.querySelectorAll(".coding_input_format__pv9fS.problem_paragraph");
        let inputFormat = Format_var[0].querySelector(".undefined.markdown-renderer").innerText;
        let outputFormat = Format_var[1].querySelector(".undefined.markdown-renderer").innerText;
        let constraints = Format_var[2].querySelector(".undefined.markdown-renderer").innerText;

        let sample = document.querySelectorAll(".coding_input_format_container__iYezu.mb-0.flex-grow-1.p-3")
        let sampleInput = sample[0].querySelector(".coding_input_format__pv9fS ").innerText;
        let sampleOutput = sample[1].querySelector(".coding_input_format__pv9fS ").innerText;

        let language_var = document.querySelectorAll(".d-flex.align-items-center.gap-1.text-blue-dark")
        const language = language_var[0].innerText;
        // console.log(language);

        return {
            problemName,
            description,
            inputFormat,
            outputFormat,
            constraints,
            sampleInput,
            sampleOutput,
            language
        };
    }

    function generatePrompt(problemData, userQuery, code) {
        return `You are an expert in Data Structures and Algorithms. Your task is to analyze the given problem and respond based on the user's query using the following rules:
        
        1. **If the user greets → Greet them accordingly.**  
        2. **If the user's question is related to the DSA problem → Provide an explanation based on the problem details.**  
        3. **If the user explicitly asks for code (e.g., "please provide code", "give me the solution") → Only then, share the solution in the ${problemData.language}  only.**  
        4. **If the question is unrelated to DSA → Respond with: "I am designed to answer only questions related to DSA problems."**  
    
        ---
    
        ### **Problem Details**
        **Problem Name:** ${problemData.problemName}
        
        **Description:**  
        ${problemData.description}
        
        **Input Format:**  
        ${problemData.inputFormat}
        
        **Output Format:**  
        ${problemData.outputFormat}
        
        **Constraints:**  
        ${problemData.constraints}
        
        **Sample Input:**  
        \`\`\`
        ${problemData.sampleInput}
        \`\`\`
        
        **Sample Output:**  
        \`\`\`
        ${problemData.sampleOutput}
        \`\`\`
        
        **User's Question:**  
        ${userQuery ? ` ${userQuery}` : "No specific question provided."}
        
        **Instructions for AI:**  
        - **If greeting detected** → Respond with a friendly greeting.  
        - **If DSA-related query detected** → Provide an explanation based on the given problem details.  
        - **If the user explicitly asks for the solution code (e.g., "please provide code", "give me the solution") → Share the solution in the ${problemData.language}  only. Otherwise, do not include the code.**  
        - **If the question is unrelated to DSA → Respond: "I am designed to answer only questions related to DSA problems."**  
        `;
    }


    // Function to get API key from Chrome storage
    function getApiKey() {
        return new Promise((resolve, reject) => {
            chrome.storage.sync.get("gemini_api_key", function (data) {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(data.gemini_api_key);
                }
            });
        });
    }

    function showError(message) {
        const errorDiv = document.getElementById("error-message");
        errorDiv.innerText = `⚠️ ${message}`;
        errorDiv.style.display = "block"; 
    }

    function hideError() {
        document.getElementById("error-message").style.display = "none";
    }


    const sendMessage = async () => {
        const text = inputField.value.trim();
        if (!text) return;
        scrollToBottom();
        let userQuery = text;
        let problemData = extractDSAProblem();
        let prompt = generatePrompt(problemData, userQuery, code);
        // console.log(prompt);

        // Hide send icon and show spinner
        document.getElementById("send-icon").style.display = "none";
        document.getElementById("spinner").style.display = "inline-block";

        // Append user message to chat
        const userMessage = document.createElement("div");
        userMessage.className = "message user-message";
        userMessage.innerText = text;
        messagesDiv.appendChild(userMessage);
        inputField.value = "";

        try {
            hideError();
            const api_key_var = await getApiKey();
            if (!api_key_var) throw new Error("API key not found in storage");

            const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${api_key_var}`;

            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [
                        {
                            role: "user",
                            parts: [{ text: prompt }]
                        }
                    ]
                })
            });

            const data = await response.json();
            if (!response.ok) {
                showError(data.error.message)
                // console.log(data.error.message);
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            if (data && data.candidates[0]?.content.parts[0]?.text) {
                const botText = data.candidates[0]?.content.parts[0]?.text;
                chatHistory.push({ sender: "user", text });
                localStorage.setItem(storageKey, JSON.stringify(chatHistory));
                // Append bot response to chat
                const botMessage = document.createElement("div");
                botMessage.className = "message bot-message";
                botMessage.innerText = botText;
                messagesDiv.appendChild(botMessage);

                chatHistory.push({ sender: "bot", text: botText });
                localStorage.setItem(storageKey, JSON.stringify(chatHistory));
            }
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        } catch (error) {
            console.error("Error fetching response:", error.message);
        } finally {
            document.getElementById("send-icon").style.display = "inline-block";
            document.getElementById("spinner").style.display = "none";
        }
    };

    sendButton.addEventListener("click", sendMessage);
    inputField.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            sendMessage();
        }
    });

    const style = document.createElement("style");
    style.innerHTML = `
        #chatbot-container {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 350px;
            background: rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
            border: 1px solid #8a2be2;
            border-radius: 12px;
            padding: 15px;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
        }

    #chatbot-header {
    background: linear-gradient(to right, black, #8a2be2);
    color: white;
    font-size: 1.2rem;
    font-weight: bold;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid #8a2be2;
  }
    #chatbot-messages {
      display: flex;
    flex-direction: column;
    align-items: flex-start; /* Default aligns bot messages to the left */
    gap: 10px; /* Adds spacing between messages */
    height: 250px;
    overflow-y: auto;
    padding: 10px;
  }
    #chatbot-input-container {
    display: flex;
    align-items: center;
    gap: 10px; /* Adds spacing between input and button */
    background-color: rgba(255, 255, 255, 0.2); /* Glassmorphism effect */
    border-radius: 10px;
    padding: 5px 10px;
    backdrop-filter: blur(10px);
}
    /* Spinner (Initially Hidden) */
.spinner {
    display: none;
    width: 20px;
    height: 20px;
    border: 2px solid white;
    border-top: 2px solid transparent;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}
    .error {
    background-color: #ffdddd;
    color: #d8000c;
    border: 1px solid #d8000c;
    padding: 10px;
    margin: 10px 0;
    display: none; /* Hide it initially */
    border-radius: 5px;
}


/* Animation for Spinning Effect */
@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}


#chatbot-input {
    flex: 1; 
    background: transparent;
    border: none;
    outline: none;
    color: white;
    padding: 8px;
    font-size: 16px;
}

#chatbot-input::placeholder {
    color: rgba(255, 255, 255, 0.5);
}

#chatbot-send {
    background: none;
    border: none;
    cursor: pointer;
    padding: 5px;
}

#chatbot-send svg {
    width: 24px;
    height: 24px;
    transition: transform 0.2s ease-in-out;
}

#chatbot-send:hover svg {
    transform: scale(1.1); 
}

   .user-message {
    background: #8a2be2;
    color: white;
    text-align: left;  
    padding: 10px 15px;
    border-radius: 12px;
    max-width: 60%; 
    word-wrap: break-word;
    display: inline-block;
    align-self: flex-end;
    margin-left: auto; 
    margin-right: 10px;  
}
        .bot-message {
            background: rgba(255, 255, 255, 0.2);
            border: 1px solid #8a2be2;
            color: white;
            text-align: left;
            padding: 10px;
            border-radius: 12px;
            margin: 5px 0;
        }
    `;

    document.head.appendChild(style);
}

