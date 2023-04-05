import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';

function App() {
  const [questions, setQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [socket, setSocket] = useState(null); // Add a state to store the WebSocket instance

  useEffect(() => {
    // Connect to WebSocket server
    const ws = new WebSocket('ws://localhost:5000');
    setSocket(ws); // Store the WebSocket instance in state

    // Listen for messages from the server
    ws.onmessage = (event) => {
      // Update answer state with received word
      console.log("onevent",event)
      setAnswer((prevAnswer) => prevAnswer + ' ' + event.data);
    };

    // Fetch questions from server
    axios.get('http://localhost:5000/questions')
    .then((response) => {
      if (response.status === 200) {
        return response.data;
      } else if (response.status === 304) {
        // Resource has not been modified, handle accordingly
        // For example, you can use the previously fetched data
        console.log("Resource has not been modified");
        return questions; // Return previous state to prevent setting questions to null
      } else {
        // Handle other response status codes
        // For example, show an error message
        console.error('Failed to fetch questions:', response.statusText);
      }
    })
    .then((data) => {
      // Handle fetched data
      console.log("data is", data);
      setQuestions(data);
    })
    .catch((error) => {
      console.error('Failed to fetch questions:', error);
    });

    console.log("data is here",questions);

    // Close WebSocket connection when component unmounts
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  // Handle question selection
  const handleQuestionSelect = (event) => {
   
    setSelectedQuestion(event.target.value);
    setAnswer('');
  };

  // Handle question submission
  const handleQuestionSubmit = () => {
    // Check if WebSocket is open before sending a message
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(selectedQuestion);
    } else {
      console.error('WebSocket is not open. Failed to send message.');
    }
  };

  return (
    <div className="App">
      <h1>Questions and Answers</h1>
      <select value={selectedQuestion} onChange={handleQuestionSelect}>
        <option value="">Select a question</option>
        {questions.map((question) => (
          <option key={question.id} value={question.question}>
            {question.question}
          </option>
        ))}
      </select>
      <button onClick={handleQuestionSubmit}>Submit</button>
      <div className="answer">{answer}</div>
    </div>
  );
}

export default App;
