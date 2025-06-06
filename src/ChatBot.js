import React, { useEffect, useRef, useState } from 'react';
import './styles/changchang.css'
import axios from 'axios';

function App() {
  const [estate, setEstate] = useState({});
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState('');
  const [messages, setMessages] = useState([]);
  
  const [DF, setDF] = useState('');
  const [flag, setFlag] = useState(false);
  const [payRef, setpayRef] = useState('');
  const [dongRef, setdongRef] = useState('');

  const [sessionId] = useState(() => {
    const saved = localStorage.getItem('sessionId');
    if (saved) return saved;
    const randomId = Math.random().toString(36).substring(7);
    localStorage.setItem('sessionId', randomId)
    return randomId;
  })
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && question.trim() !== '') {
      SendQuestion();
    }
  };

  function SendQuestion() {
    console.log("보낼 질문:", question);

    const userMessage = { sender: "user", text: question };
    setMessages((prev) => [...prev, userMessage]);

    fetch("http://localhost:3002/api/chat", {
      method: "post",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: question, sessionId: sessionId })
    }).then((res) => res.json())
      .then((data) => {
        // console.log("Dialogflow 응답 :", data);
        
        setDF(data);
        if (data.parameters?.fields?.dong?.stringValue){
          console.log("dongin")
          setdongRef(data.parameters?.fields?.dong?.stringValue);
        }
        
        if (data.parameters?.fields?.pay?.stringValue){
          console.log("payin")
          setpayRef(data.parameters?.fields?.pay?.stringValue);
        }

        setAnswer(data.answer)
        
        const botMessage = { sender: "chang", text: data.answer };
        setMessages((prev) => [...prev, botMessage])
      }).catch((err) => console.log("에러발생1", err))

    setFlag("true");
    setQuestion("");  // 입력창 비우기
  }

  useEffect(() => {
    console.log('flag', flag)
    console.log('payRef', payRef)
    console.log('dongRef', dongRef)

    if (flag && payRef && dongRef){
      console.log("in", question)
      axios.get(
        'http://localhost:8085/controller/test',
        {
          params: {
            question: question,
            dong: dongRef,
            pay: payRef
          }
        }
      )
      .then((res) => {
        console.log("스프링응답", res.data)
      })
    }
  }, [DF])

  useEffect(() => {
    const initialMessage = {
      sender: 'chang',
      text: '안녕하세요!\n행정동과 업종을 알려주세요!'
    };
    setMessages([initialMessage]);
  }, []);

  // 채팅 영역에 대한 ref 추가
  const chatAreaRef = useRef(null);

  // 메시지 목록이 업데이트될 때마다 스크롤을 맨 아래로 이동
  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages]); // messages 배열이 변경될 때마다 실행

  return (
    <div className='chat'>
      <div className="chatArea" ref={chatAreaRef}>
        {messages.map((msg, index) => (
          <div key={index} className={msg.sender === 'user' ? 'userMessage' : 'botMessage'}>
          {msg.text.split('\n').map((line, i) => (
            <React.Fragment key={i}>
              {line}
              <br />
            </React.Fragment>
          ))}
        </div>
        ))}
      </div>

      <div className='inputChat'>
        <input type='text'
          placeholder='  텍스트를 입력해주세요'
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button onClick={SendQuestion}>입력</button>
      </div>
    </div>
  );
}

export default App;
