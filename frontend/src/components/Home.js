import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, setDoc, getDoc, query, collection, where, getDocs, orderBy, updateDoc, arrayUnion, deleteDoc } from 'firebase/firestore';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Button, Modal, Card, Container, Row, Col, Carousel, Form } from 'react-bootstrap';
import { BoxArrowRight } from 'react-bootstrap-icons';
import { Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import '../assets/css/Home.css';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import avatar1 from '../assets/images/avatar1.jpg';
import avatar2 from '../assets/images/avatar2.jpg';
import sonicGif from '../assets/images/sonic.gif';
import cloudsImg from '../assets/images/clouds.png';
import pipeImg from '../assets/images/pipe.png';
import marioGif from '../assets/images/mario.gif';
import logoImg from '../assets/images/logo.png';
import shopIcon from '../assets/images/pipe.png';
import lockImg from '../assets/images/lock.png';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

const Home = () => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRankModal, setShowRankModal] = useState(false);
  const [showShopModal, setShowShopModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showConfirmPasswordModal, setShowConfirmPasswordModal] = useState(false);
  const [showPDFModal, setShowPDFModal] = useState(false); // Modal para exibir PDF
  const [isLogin, setIsLogin] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [userStats, setUserStats] = useState({ coins: 0, score: 0 });
  const [selectedAvatarIndex, setSelectedAvatarIndex] = useState(0);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [bio, setBio] = useState('');
  const [rankedUsers, setRankedUsers] = useState([]);
  const [loggedInUserRank, setLoggedInUserRank] = useState(null);
  const [hasNewPix, setHasNewPix] = useState(false);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [equippedItem, setEquippedItem] = useState(null);
  const [showDashboardModal, setShowDashboardModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchedUser, setSearchedUser] = useState(null);
  const [playerStats, setPlayerStats] = useState(null);
  const [coinStats, setCoinStats] = useState(null);
  const [recordings, setRecordings] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [pdfUrl, setPdfUrl] = useState(''); // URL do PDF gerado
  const usernameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const bioRef = useRef(null);
  const pixUsernameRef = useRef(null);
  const pixAmountRef = useRef(null);
  const confirmPasswordRef = useRef(null);
  const searchUsernameRef = useRef(null);
  const navigate = useNavigate();

  const avatars = [avatar1, avatar2];

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:3001/usuarios');
      setUsuarios(response.data);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    }
  };

  const addUser = async (user) => {
    try {
      const response = await axios.post('http://localhost:3001/usuario', user);
      console.log(response.data);
      fetchUsers(); // Atualiza a lista de usuários após adicionar um novo
    } catch (error) {
      console.error('Erro ao adicionar usuário:', error);
    }
  };

  const shopItems = [
    { id: 1, name: 'Avatar 1', image: avatar1, price: 2 },
    { id: 2, name: 'Avatar 2', image: avatar2, price: 5 },
  ];

  const handleBuyItem = async (item) => {
    if (userStats.coins >= item.price) {
      const newCoins = userStats.coins - item.price;
      const newItem = {
        id: item.id,
        name: item.name,
        image: sonicGif,
      };

      const updatedInventory = [...inventory, newItem];
      setInventory(updatedInventory);
      setUserStats((prevStats) => ({
        ...prevStats,
        coins: newCoins,
      }));

      try {
        await updateDoc(doc(db, "usernames", auth.currentUser.uid), {
          coins: newCoins,
          inventory: updatedInventory,
        });

        alert(`Você comprou ${item.name} por ${item.price} coins!`);
      } catch (error) {
        console.error("Erro ao atualizar o inventário:", error);
      }
    } else {
      alert('Você não tem coins suficientes.');
    }
  };

  const handleEquipItem = async (item) => {
    if (equippedItem && equippedItem.id === item.id) {
      setEquippedItem(null);
    } else {
      setEquippedItem(item);
    }

    try {
      await updateDoc(doc(db, "usernames", auth.currentUser.uid), {
        equippedItem: equippedItem?.id === item.id ? null : item,
      });
    } catch (error) {
      console.error("Erro ao atualizar o item equipado:", error);
    }
  };

  const getTransactionData = () => {
    const sentTransactions = transactionHistory.filter(transaction => transaction.type === 'sent');
    const receivedTransactions = transactionHistory.filter(transaction => transaction.type === 'received');

    const sentAmounts = sentTransactions.map(transaction => transaction.amount);
    const receivedAmounts = receivedTransactions.map(transaction => transaction.amount);

    return {
      labels: transactionHistory.map(transaction => new Date(transaction.date).toLocaleDateString()),
      datasets: [
        {
          label: 'Enviado',
          data: sentAmounts,
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
        },
        {
          label: 'Recebido',
          data: receivedAmounts,
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
        },
      ],
    };
  };

  const getPieData = () => {
    const sentTransactions = transactionHistory.filter(transaction => transaction.type === 'sent');
    const receivedTransactions = transactionHistory.filter(transaction => transaction.type === 'received');

    const totalSent = sentTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
    const totalReceived = receivedTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);

    return {
      labels: ['Enviado', 'Recebido'],
      datasets: [
        {
          data: [totalSent, totalReceived],
          backgroundColor: ['rgba(255, 99, 132, 0.2)', 'rgba(54, 162, 235, 0.2)'],
          borderColor: ['rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)'],
        },
      ],
    };
  };

  const getCoinStatsData = async () => {
    try {
      const usersQuery = query(collection(db, "usernames"));
      const querySnapshot = await getDocs(usersQuery);

      let totalCollected = 0;
      let totalSpent = 0;

      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        totalCollected += userData.coins || 0;
        totalSpent += userData.coinsSpent || 0;
      });

      return {
        labels: ['Coletado', 'Gasto'],
        datasets: [
          {
            data: [totalCollected, totalSpent],
            backgroundColor: ['rgba(54, 162, 235, 0.6)', 'rgba(255, 206, 86, 0.6)'],
          },
        ],
      };
    } catch (error) {
      console.error("Erro ao coletar dados de stats de coins:", error);
      return null;
    }
  };

  const closeDashboardModal = () => {
    setShowDashboardModal(false);
  };

  const handleShopClick = () => {
    setShowShopModal(true);
  };

  const handleCloseShopModal = () => {
    setShowShopModal(false);
  };

  const captureUserIP = async () => {
    try {
      const response = await axios.get('https://api.ipify.org?format=json');
      return response.data.ip;
    } catch (error) {
      console.error('Erro ao capturar o IP:', error);
      return null;
    }
  };

  const checkIfBanned = async (user) => {
    const bannedDoc = await getDoc(doc(db, "bannedUsers", user.uid));
    if (bannedDoc.exists()) {
      const banData = bannedDoc.data();
      const currentTime = new Date();
      if (new Date(banData.bannedUntil) > currentTime) {
        alert(`Você está banido até ${new Date(banData.bannedUntil).toLocaleString()}`);
        await signOut(auth);
        return true;
      }
    }
    return false;
  };

  useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "usernames", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();

          const isBanned = await checkIfBanned(user);
          if (isBanned) return;

          setLoggedInUser(userData);
          setBio(userData.bio || '');
          setUserStats({ coins: userData.coins, score: userData.score });
          setTransactionHistory(userData.transactionHistory || []);
          setInventory(userData.inventory || []);
          setEquippedItem(userData.equippedItem || null);
          setHasNewPix(userData.hasNewPix || false);

          if (userData.username === 'admin') {
            setIsAdmin(true);
          }
        }
      } else {
        setLoggedInUser(null);
        setIsAdmin(false);
      }
    });

    fetchUsers();
  }, []);

  useEffect(() => {
    if (rankedUsers.length > 0 && loggedInUser) {
      const userRankIndex = rankedUsers.findIndex((user) => user.username === loggedInUser.username);
      setLoggedInUserRank(userRankIndex);
    }
  }, [rankedUsers, loggedInUser]);

  const toggleLoginModal = () => {
    if (loggedInUser) {
      alert('Você já está logado. Para criar uma nova conta ou acessar outra conta, primeiro faça logout.');
    } else {
      setShowLoginModal(!showLoginModal);
      setErrorMessage('');
    }
  };

  const switchAuthMode = () => {
    setIsLogin(!isLogin);
    setErrorMessage('');
  };

  const validateUsername = (username) => {
    const usernameRegex = /^[a-zA-Z0-9-_]+$/;
    return usernameRegex.test(username);
  };

  const handleAuth = async () => {
    const username = usernameRef.current.value.trim();
    const email = emailRef.current ? emailRef.current.value.trim() : '';
    const password = passwordRef.current.value.trim();
    const avatar = avatars[selectedAvatarIndex];
    const ip = await captureUserIP();

    if (!validateUsername(username)) {
      setErrorMessage('Nome de usuário inválido. Use apenas letras, números, hífen (-) e sublinhado (_).');
      return;
    }

    try {
      if (isLogin) {
        const usersQuery = query(collection(db, "usernames"), where("username", "==", username));
        const querySnapshot = await getDocs(usersQuery);
        if (!querySnapshot.empty) {
          let userEmail;
          querySnapshot.forEach((doc) => {
            userEmail = doc.data().email;
          });
          await signInWithEmailAndPassword(auth, userEmail, password);
          localStorage.setItem('username', username);
          setShowLoginModal(false);

          if (username === 'admin' && password === 'admin123') {
            setIsAdmin(true);
          }

          navigate('/');
        } else {
          setErrorMessage('Nome de usuário não encontrado.');
        }
      } else {
        const usersQuery = query(collection(db, "usernames"), where("username", "==", username));
        const querySnapshot = await getDocs(usersQuery);

        if (!querySnapshot.empty) {
          setErrorMessage('Nome de usuário já está em uso. Escolha outro.');
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const newUser = {
          username: username,
          email: user.email,
          coins: 0,
          score: 0
        };

        await setDoc(doc(db, "usernames", user.uid), {
          ...newUser,
          avatar: avatar,
          bio: '',
          inventory: [],
          equippedItem: null,
          transactionHistory: [],
          hasNewPix: false,
          ip: ip,
        });

        await addUser(newUser);

        await signInWithEmailAndPassword(auth, email, password);
        localStorage.setItem('username', username);
        setShowLoginModal(false);
        setShowLoginModal(true);
        alert('Cadastro bem-sucedido! Faça login para jogar.');
        setIsLogin(true);
      }
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const handlePlayButton = () => {
    if (auth.currentUser) {
      navigate('/game');
    } else {
      alert('Você precisa criar uma conta para jogar.');
    }
  };

  const handleRankButton = async () => {
    if (auth.currentUser) {
      try {
        await getRankedUsers();
        setShowRankModal(true);
      } catch (error) {
        setErrorMessage('Erro ao buscar ranking.');
      }
    } else {
      alert('Você precisa estar logado para ver o ranking.');
    }
  };

  const getRankedUsers = async () => {
    try {
      const usersQuery = query(collection(db, "usernames"), orderBy("score", "desc"));
      const querySnapshot = await getDocs(usersQuery);
      const users = [];
      querySnapshot.forEach((doc) => {
        users.push(doc.data());
      });
      setRankedUsers(users);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
    }
  };

  const handleShopButton = () => {
    setShowShopModal(true);
  };

  const closeShopModal = () => {
    setShowShopModal(false);
  };

  const handleBankButton = () => {
    setShowBankModal(true);
    setHasNewPix(false);
    if (auth.currentUser) {
      updateDoc(doc(db, "usernames", auth.currentUser.uid), { hasNewPix: false });
    }
  };

  const closeBankModal = () => {
    setShowBankModal(false);
  };

  const openConfirmPasswordModal = () => {
    setShowConfirmPasswordModal(true);
  };

  const closeConfirmPasswordModal = () => {
    setShowConfirmPasswordModal(false);
  };

  const handlePix = () => {
    openConfirmPasswordModal();
  };

  const confirmPix = async () => {
    const pixUsername = pixUsernameRef.current ? pixUsernameRef.current.value.trim() : '';
    const pixAmount = pixAmountRef.current ? parseInt(pixAmountRef.current.value) : 0;
    const confirmPassword = confirmPasswordRef.current ? confirmPasswordRef.current.value : '';

    if (!confirmPassword || !pixAmount || pixAmount <= 0) {
      alert('Por favor, insira uma senha válida e uma quantidade válida de coins.');
      return;
    }

    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, confirmPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);

      const usersQuery = query(collection(db, "usernames"), where("username", "==", pixUsername));
      const querySnapshot = await getDocs(usersQuery);
      if (!querySnapshot.empty) {
        let recipientDoc;
        querySnapshot.forEach((doc) => {
          recipientDoc = doc;
        });

        const recipientData = recipientDoc.data();

        if (userStats.coins >= pixAmount) {
          const newRecipientCoins = recipientData.coins + pixAmount;
          const newSenderCoins = userStats.coins - pixAmount;

          await setDoc(doc(db, "usernames", recipientDoc.id), { coins: newRecipientCoins, hasNewPix: true }, { merge: true });
          await setDoc(doc(db, "usernames", auth.currentUser.uid), { coins: newSenderCoins }, { merge: true });

          await updateDoc(doc(db, "usernames", recipientDoc.id), {
            transactionHistory: arrayUnion({
              type: 'received',
              amount: pixAmount,
              from: loggedInUser.username,
              date: new Date().toISOString()
            })
          });

          await updateDoc(doc(db, "usernames", auth.currentUser.uid), {
            transactionHistory: arrayUnion({
              type: 'sent',
              amount: pixAmount,
              to: pixUsername,
              date: new Date().toISOString()
            })
          });

          setUserStats((prevStats) => ({
            ...prevStats,
            coins: newSenderCoins,
          }));

          setTransactionHistory((prevHistory) => [
            ...prevHistory,
            { type: 'sent', amount: pixAmount, to: pixUsername, date: new Date().toISOString() }
          ]);

          alert(`Você transferiu ${pixAmount} coins para ${pixUsername}!`);
          closeConfirmPasswordModal();
        } else {
          alert('Você não tem coins suficientes.');
        }
      } else {
        alert('Nome de usuário não encontrado.');
      }
    } catch (error) {
      console.error('Erro ao reautenticar ou transferir coins:', error);
      alert('Senha incorreta. Por favor, tente novamente.');
    }
  };

  const nextAvatar = () => {
    setSelectedAvatarIndex((prevIndex) => (prevIndex + 1) % avatars.length);
  };

  const previousAvatar = () => {
    setSelectedAvatarIndex((prevIndex) => (prevIndex - 1 + avatars.length) % avatars.length);
  };

  const handleProfileClick = () => {
    setShowProfileModal(true);
  };

  const handleProfileSave = async () => {
    if (auth.currentUser && bioRef.current) {
      const newBio = bioRef.current.value;
      try {
        await setDoc(doc(db, "usernames", auth.currentUser.uid), { bio: newBio }, { merge: true });
        setBio(newBio);
        setShowProfileModal(false);
      } catch (error) {
        console.error("Erro ao salvar a biografia:", error);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setLoggedInUser(null);
      setLoggedInUserRank(null);
      setIsAdmin(false);
      setShowProfileModal(false);
      setShowBankModal(false);
      setShowDashboardModal(false);
      window.location.reload();
    } catch (error) {
      console.error('Erro ao deslogar:', error);
    }
  };

  const getBackgroundColor = (index) => {
    switch (index) {
      case 0:
        return 'rgba(255, 255, 0, 0.3)';
      case 1:
        return 'rgba(192, 192, 192, 0.3)';
      case 2:
        return 'rgba(165, 42, 42, 0.3)';
      default:
        return 'rgba(255, 255, 255, 0.3)';
    }
  };

  const VerifiedBadge = () => (
    <svg aria-label="Verificado" className="verified-badge" fill="rgb(0, 149, 246)" height="18" role="img" viewBox="0 0 40 40" width="18">
      <title>Verificado</title>
      <path d="M19.998 3.094 14.638 0l-2.972 5.15 H3.094 5.432v6.354L0 14.64 3.094 20 0 25.359l5.432 3.137v5.905h5.975L14.638 40l5.36-3.094L25.358 40l3.232-5.6h6.162v-6.01L40 25.359 36.905 20 40 14.641l-5.248-3.03v-6.46h-6.419L25.358 0l-5.36 3.094Zm7.415 11.225 2.254 2.287-11.43 11.5-6.835-6.93 2.244-2.258 4.587 4.581 9.18-9.18Z" fill-rule="evenodd"></path>
    </svg>
  );

  const getPlayerStatsData = async () => {
    const usersQuery = query(collection(db, "usernames"));
    const querySnapshot = await getDocs(usersQuery);

    let loggedInCount = 0;
    let loggedOutCount = 0;

    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      if (userData.isLoggedIn) {
        loggedInCount++;
      } else {
        loggedOutCount++;
      }
    });

    return {
      labels: ['Logado', 'Deslogado'],
      datasets: [
        {
          data: [loggedInCount, loggedOutCount],
          backgroundColor: ['rgba(75, 192, 192, 0.6)', 'rgba(255, 99, 132, 0.6)'],
        },
      ],
    };
  };

  const handleDashboardButton = async () => {
    const playerStatsData = await getPlayerStatsData();
    const coinStatsData = await getCoinStatsData();

    setPlayerStats(playerStatsData);
    setCoinStats(coinStatsData);
    setShowDashboardModal(true);
  };

  const getRecordings = async (uid) => {
    const userDoc = await getDoc(doc(db, "usernames", uid));
    if (userDoc.exists()) {
      return userDoc.data().recordings || [];
    }
    return [];
  };

  const searchUser = async () => {
    const username = searchUsernameRef.current.value.trim();
    if (!username) return;

    const usersQuery = query(collection(db, "usernames"), where("username", "==", username));
    const querySnapshot = await getDocs(usersQuery);

    if (!querySnapshot.empty) {
      let userData;
      let uid;
      querySnapshot.forEach((doc) => {
        userData = { ...doc.data(), uid: doc.id };
        uid = doc.id;
      });
      setSearchedUser(userData);
      const recordings = await getRecordings(uid);
      setRecordings(recordings);
    } else {
      alert('Usuário não encontrado.');
      setSearchedUser(null);
      setRecordings([]);
    }
  };

  const resetScore = async () => {
    if (!searchedUser) return;
    try {
      await updateDoc(doc(db, "usernames", searchedUser.uid), { score: 0 });
      alert('Score resetado com sucesso.');
    } catch (error) {
      console.error('Erro ao resetar score:', error);
    }
  };

  const deleteUserAccount = async () => {
    if (!searchedUser) return;
    try {
      await deleteDoc(doc(db, "usernames", searchedUser.uid));
      alert('Conta deletada com sucesso.');
      setSearchedUser(null);
    } catch (error) {
      console.error('Erro ao deletar conta:', error);
    }
  };

  const banUser = async (minutes) => {
    if (!searchedUser) return;
    try {
      const banUntil = new Date();
      banUntil.setMinutes(banUntil.getMinutes() + minutes);
      await setDoc(doc(db, "bannedUsers", searchedUser.uid), {
        username: searchedUser.username,
        ip: searchedUser.ip,
        bannedUntil: banUntil.toISOString(),
      });
      alert(`Usuário banido por ${minutes} minutos.`);
      setSearchedUser(null);
    } catch (error) {
      console.error('Erro ao banir usuário:', error);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();

    if (searchedUser) {
      doc.addImage(searchedUser.avatar, 'JPEG', 10, 10, 30, 30);
      doc.setFontSize(16);
      doc.text(`Usuario: ${searchedUser.username}`, 50, 20);

      if (recordings.length > 0) {
        const tableColumn = ["Date", "Score", "Coins", "Video URL"];
        const tableRows = [];

        recordings.forEach(recording => {
          const recordingData = [
            new Date(recording.date).toLocaleString(),
            recording.score,
            recording.coins,
            recording.videoUrl
          ];
          tableRows.push(recordingData);
        });

        doc.autoTable(tableColumn, tableRows, { startY: 50 });
      } else {
        doc.text('No recordings found.', 10, 50);
      }

      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      setPdfUrl(pdfUrl);
      setShowPDFModal(true);
    }
  };

  const handleClosePDFModal = () => {
    setShowPDFModal(false);
  };

  return (
    <div className="home-board">
      <img src={cloudsImg} className="clouds" alt="Clouds" />
      <img src={pipeImg} className="pipe-static" alt="Pipe" />
      <img src={marioGif} className="mario" alt="Mario" />
      <div className="home-content">
        <img src={logoImg} className="logo" alt="Logo" />
        <h1 className="welcome-text">Seja Bem vindo ao jogo</h1>
        <button className="play-button" onClick={handlePlayButton}>Jogar</button>
        <button className="login-button" onClick={toggleLoginModal}>Login</button>
        <button className="rank-button" onClick={handleRankButton}>Rank</button>
        <button className="shop-button" onClick={handleShopClick}>Loja</button>
        {loggedInUser && isAdmin ? (
          <button
            className="dashboard-button"
            onClick={handleDashboardButton}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              fontSize: '16px',
              borderRadius: '5px',
              cursor: 'pointer',
              marginTop: '10px',
            }}
          >
            Dashboard
          </button>
        ) : (
          loggedInUser && (
            <button className="bank-button" onClick={handleBankButton}>
              BankMario
              {hasNewPix && <span className="notification-dot"></span>}
            </button>
          )
        )}
      </div>

      {showLoginModal && (
        <div className="modal-background">
          <div className="modal-content">
            <h2>{isLogin ? 'Login' : 'Cadastro'}</h2>
            {errorMessage && <p className="error-message">{errorMessage}</p>}

            {!isLogin && (
              <div className="avatar-selection">
                <button onClick={previousAvatar}>&lt;</button>
                <img src={avatars[selectedAvatarIndex]} alt="Avatar" className="avatar-image" />
                <button onClick={nextAvatar}>&gt;</button>
              </div>
            )}

            <input type="text" placeholder="Nome de usuário" ref={usernameRef} />
            {!isLogin && <input type="email" placeholder="Email" ref={emailRef} />}
            <input type="password" placeholder="Senha" ref={passwordRef} />

            <button className="auth-button" onClick={handleAuth}>{isLogin ? 'Login' : 'Cadastrar'}</button>
            <p onClick={switchAuthMode}>
              {isLogin ? 'Ainda não tem conta? Cadastre-se' : 'Já tem conta? Faça login'}
            </p>
          </div>
        </div>
      )}
      {showRankModal && (
        <div className="modal-background">
          <div className="modal-content rank-modal">
            <h2>Ranking</h2>
            <div className="rank-table-wrapper">
              <table className="table rank-table">
                <thead>
                  <tr>
                    <th>Posição</th>
                    <th>Nome</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {rankedUsers.map((user, index) => (
                    <tr key={index}>
                      <td style={{ backgroundColor: getBackgroundColor(index) }}>{index + 1}º</td>
                      <td>
                        <img 
                          src={user.avatar} 
                          alt="Avatar" 
                          style={{ width: '30px', height: '30px', borderRadius: '50%', marginRight: '10px' }} 
                        />
                        {user.username}
                        {index < 3 && <VerifiedBadge />}
                      </td>
                      <td>{user.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={() => setShowRankModal(false)}>Fechar</button>
          </div>
        </div>
      )}

      {auth.currentUser && loggedInUser && (
        <div className="user-info" onClick={handleProfileClick}>
          <img src={loggedInUser.avatar} alt="User Avatar" className="user-avatar" />
          <span className="user-name">
            {loggedInUser.username}
            {loggedInUserRank !== null && loggedInUserRank < 3 && <VerifiedBadge />}
          </span>
        </div>
      )}

      {showProfileModal && loggedInUser && (
        <div className="profile-modal">
          <div className="profile-content">
            <Button variant="link" className="logout-button" onClick={handleLogout}>
              <BoxArrowRight size={24} />
            </Button>
            <img src={loggedInUser.avatar} alt="Avatar" className="profile-avatar" />
            <p className="profile-username">
              {loggedInUser.username}
              {loggedInUserRank !== null && loggedInUserRank < 3 && <VerifiedBadge />}
            </p>
            <textarea
              ref={bioRef}
              className="profile-bio"
              placeholder="Digite sua biografia"
              defaultValue={bio}
            />
            <button className="profile-save-button" onClick={handleProfileSave}>Salvar</button>
            <button className="profile-close-button" onClick={() => setShowProfileModal(false)}>Fechar</button>
          </div>
        </div>
      )}

      <Modal show={showShopModal} onHide={closeShopModal} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Loja</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Carousel>
            {shopItems.map(item => (
              <Carousel.Item key={item.id}>
                <Card className="text-center">
                  <Card.Img variant="top" src={item.image} />
                  <Card.Body>
                    <Card.Title>{item.name}</Card.Title>
                    <Card.Text>{`Preço: ${item.price} coins`}</Card.Text>
                    <Button variant="primary" onClick={() => handleBuyItem(item)}>Comprar</Button>
                  </Card.Body>
                </Card>
              </Carousel.Item>
            ))}
          </Carousel>
          <div className="inventory mt-4">
            <h5>Seu Inventário</h5>
            <Row>
              {inventory.map((item) => (
                <Col key={item.id} xs={6} md={4}>
                  <Card className="text-center mb-4">
                    <Card.Img variant="top" src={item.image} />
                    <Card.Body>
                      <Card.Title>{item.name}</Card.Title>
                      <Button
                        variant={equippedItem?.id === item.id ? "secondary" : "success"}
                        onClick={() => handleEquipItem(item)}
                      >
                        {equippedItem?.id === item.id ? "Equipado" : "Equipar"}
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeShopModal}>Fechar</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showBankModal} onHide={closeBankModal} centered size="xl">
        <Modal.Header closeButton>
          <Modal.Title>Banco</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Container>
            <Row className="justify-content-center">
              <Col xs={12} md={4}>
                <Card className="text-center mb-4">
                  <Card.Body>
                    <Card.Img variant="top" src={loggedInUser?.avatar || ''} className="user-avatar" />
                    <Card.Title>{loggedInUser?.username}</Card.Title>
                    <Card.Text>
                      Coins: {userStats.coins}
                    </Card.Text>
                    <Form>
                      <Form.Group controlId="pixUsername">
                        <Form.Label>Nome do usuário</Form.Label>
                        <Form.Control type="text" ref={pixUsernameRef} placeholder="Nome do usuário para enviar coins" />
                      </Form.Group>
                      <Form.Group controlId="pixAmount">
                        <Form.Label>Quantidade de coins</Form.Label>
                        <Form.Control type="number" ref={pixAmountRef} placeholder="Quantidade de coins" />
                      </Form.Group>
                      <Button variant="primary" onClick={handlePix}>Enviar</Button>
                    </Form>
                  </Card.Body>
                </Card>
              </Col>
              <Col xs={12} md={4}>
                <Card className="text-center mb-4">
                  <Card.Body>
                    <Card.Title>Histórico de Transações</Card.Title>
                    <ul className="transaction-history">
                      {transactionHistory.map((transaction, index) => (
                        <li key={index} className={`transaction ${transaction.type}`}>
                          {transaction.type === 'received' ? (
                            <span>Recebido de {transaction.from}: {transaction.amount} coins</span>
                          ) : (
                            <span>Enviado para {transaction.to}: {transaction.amount} coins</span>
                          )}
                          <span>{new Date(transaction.date).toLocaleString()}</span>
                        </li>
                      ))}
                    </ul>
                  </Card.Body>
                </Card>
              </Col>
              <Col xs={12} md={4}>
                <Card className="text-center mb-4">
                  <Card.Body>
                    <Card.Title>Gráfico de Transações</Card.Title>
                    <Line data={getTransactionData()} />
                  </Card.Body>
                </Card>
                <Card className="text-center">
                  <Card.Body>
                    <Card.Title>Gráfico de Pizza</Card.Title>
                    <Pie data={getPieData()} />
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Container>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeBankModal}>Fechar</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showDashboardModal} onHide={closeDashboardModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Admin Dashboard</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Container>
            <Row>
              <Col xs={12} md={6}>
                <Card>
                  <Card.Body>
                    <Card.Title>Jogadores Status</Card.Title>
                    {playerStats && <Pie data={playerStats} />}
                  </Card.Body>
                </Card>
              </Col>
              <Col xs={12} md={6}>
                <Card>
                  <Card.Body>
                    <Card.Title>Coins Status</Card.Title>
                    {coinStats && <Pie data={coinStats} />}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
            <Row className="mt-4">
              <Col>
                <Form>
                  <Form.Control
                    type="text"
                    placeholder="Pesquisar pelo nome de usuario"
                    ref={searchUsernameRef}
                    className="mr-2"
                  />
                  <Button onClick={searchUser}>Pesquisar</Button>
                </Form>
                {searchedUser && (
                  <div className="mt-4">
                    <h5>User: {searchedUser.username}</h5>
                    <p>Coins: {searchedUser.coins}</p>
                    <p>Score: {searchedUser.score}</p>
                    <Button variant="warning" onClick={resetScore}>Resetar Score</Button>{' '}
                    <Button variant="danger" onClick={deleteUserAccount}>Delete conta</Button>{' '}
                    <Button variant="secondary" onClick={() => banUser(2)}>Banir 2 Minutos</Button>{' '}
                    <Button variant="secondary" onClick={() => banUser(60)}>Banir 1 Hora</Button>{' '}
                    <Button variant="secondary" onClick={() => banUser(3*60)}>Banir 3 Horas</Button>{' '}
                    <Button variant="secondary" onClick={() => banUser(24*60)}>Banir 1 Dia</Button>

                    {/* Exibir as gravações das partidas */}
                    <div className="recordings-section mt-4">
                      <Button variant="primary" onClick={generatePDF}>Gerar PDF</Button>
                    </div>
                  </div>
                )}
              </Col>
            </Row>
          </Container>
        </Modal.Body>
      </Modal>

      <Modal show={showConfirmPasswordModal} onHide={closeConfirmPasswordModal} centered size="sm">
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Senha</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="lock-container">
            <img src={lockImg} alt="Lock" className="lock-image" />
          </div>
          <Form>
            <Form.Group controlId="confirmPassword">
              <Form.Label>Digite sua senha</Form.Label>
              <Form.Control type="password" ref={confirmPasswordRef} placeholder="Senha" />
            </Form.Group>
            <Button variant="primary" onClick={confirmPix}>Confirmar</Button>
          </Form>
        </Modal.Body>
      </Modal>

      <Modal show={showPDFModal} onHide={handleClosePDFModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>PDF de Gravações de Partidas</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <iframe src={pdfUrl} width="100%" height="500px"></iframe>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClosePDFModal}>Fechar</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Home;
