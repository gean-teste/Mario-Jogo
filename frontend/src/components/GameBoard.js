import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import '../assets/css/GameBoard.css';
import marioGif from '../assets/images/mario.gif'; 
import pipeImg from '../assets/images/pipe.png';
import cloudsImg from '../assets/images/clouds.png';
import gameOverImg from '../assets/images/game-over.png';
import heartImg from '../assets/images/heart.png';
import coinImg from '../assets/images/coin.png';

const GameBoard = () => {
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [username, setUsername] = useState('');
  const [hasPassedPipe, setHasPassedPipe] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [lives, setLives] = useState(3);
  const [canJump, setCanJump] = useState(true);
  const [coinPosition, setCoinPosition] = useState({ left: 800, bottom: 100, visible: true });
  const [equippedItem, setEquippedItem] = useState(null); 

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "usernames", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUsername(userData.username);
            setEquippedItem(userData.equippedItem); 
          } else {
            console.error("Nenhum documento encontrado para o usuário.");
          }
        } catch (error) {
          console.error("Erro ao buscar dados do usuário:", error);
        }
      } else {
        console.error("Nenhum usuário logado.");
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    if (isGameOver) {
      const updateUserData = async () => {
        try {
          const user = auth.currentUser;
          if (user) {
            const userRef = doc(db, "usernames", user.uid);
            const userDoc = await getDoc(userRef);
            const userData = userDoc.data();
            const currentCoins = userData.coins || 0;
            const currentScore = userData.score || 0;

            // Atualizar coins e score
            await updateDoc(userRef, {
              coins: currentCoins + coins,
              score: currentScore + score,
              recordings: arrayUnion({
                score,
                coins,
                date: new Date().toISOString()
              })
            });
          }
        } catch (error) {
          console.error("Erro ao atualizar dados do usuário:", error);
        }
      };

      updateUserData();
    }
  }, [isGameOver, coins, score]);

  const jump = () => {
    const mario = document.querySelector('.mario');
    if (!canJump || mario.classList.contains('jump')) return;
    mario.classList.add('jump');
    setTimeout(() => {
      mario.classList.remove('jump');
    }, 500);
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === 'Space' && canJump && !isGameOver) {
        jump();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [canJump, isGameOver]);

  useEffect(() => {
    const mario = document.querySelector('.mario');
    const pipe = document.querySelector('.pipe');
    const gameBoard = document.querySelector('.game-board');

    const loop = setInterval(() => {
      const pipePosition = pipe.offsetLeft;
      const marioPosition = +window.getComputedStyle(mario).bottom.replace('px', '');
      const marioLeft = mario.getBoundingClientRect().left;
      const marioRight = marioLeft + mario.offsetWidth;

      // Verificação de colisão
      if (pipePosition <= 80 && pipePosition > 0 && marioPosition < 80 && !isGameOver) {
        pipe.style.animation = 'none';
        pipe.style.left = `${pipePosition}px`;

        mario.style.animation = 'none';
        mario.style.bottom = `${marioPosition}px`;

        mario.src = gameOverImg;
        mario.style.width = '75px';
        mario.style.marginLeft = '75px';

        setIsGameOver(true);
        setCanJump(false);
        clearInterval(loop);
      } else if (pipePosition < 0 && !hasPassedPipe) {
        // Incremento do score corretamente
        setScore((prevScore) => prevScore + 1);
        setHasPassedPipe(true);
      } else if (pipePosition >= 0) {
        setHasPassedPipe(false);
      }

      if (coinPosition.visible) {
        const coinLeft = pipePosition + 200;
        const coinRight = coinLeft + 30;
        const coinBottom = coinPosition.bottom;
        const coinTop = coinBottom + 30;

        const isCollected =
          marioRight >= coinLeft &&
          marioLeft <= coinRight &&
          marioPosition + mario.offsetHeight >= coinBottom &&
          marioPosition <= coinTop;

        if (isCollected) {
          setCoins((prevCoins) => prevCoins + 1);
          setCoinPosition({ ...coinPosition, visible: false });
        } else if (coinLeft <= -30) {
          setCoinPosition({ ...coinPosition, visible: false });
        } else {
          setCoinPosition((prev) => ({ ...prev, left: coinLeft }));
        }
      }

      if (score >= 5) {
        gameBoard.classList.add('high-score');
      } else {
        gameBoard.classList.remove('high-score');
      }
    }, 50);

    return () => {
      clearInterval(loop);
    };
  }, [score, hasPassedPipe, isGameOver, coinPosition]);

  useEffect(() => {
    if (!coinPosition.visible && !isGameOver) {
      setTimeout(() => {
        setCoinPosition({ left: 800, bottom: 100, visible: true });
      }, 1000);
    }
  }, [coinPosition, isGameOver]);

  const resetGame = () => {
    setCoins(0);
    setScore(0);
    setIsGameOver(false);
    setCanJump(true);
    setHasPassedPipe(false);
    setCoinPosition({ left: 800, bottom: 100, visible: true });

    const mario = document.querySelector('.mario');
    const pipe = document.querySelector('.pipe');

    mario.src = equippedItem ? equippedItem.image : marioGif; // Usar o item equipado
    mario.style.width = '150px';
    mario.style.marginLeft = '0';
    mario.style.bottom = '0';

    pipe.style.animation = 'pipe-animation 2s infinite linear';
    pipe.style.left = '';

    mario.classList.remove('jump');

    setTimeout(() => {
      pipe.style.animation = 'pipe-animation 2s infinite linear';
      mario.style.animation = '';
      mario.src = equippedItem ? equippedItem.image : marioGif; // Usar o item equipado
    }, 100);
  };

  const revive = () => {
    if (lives > 0) {
      setLives(lives - 1);
      setIsGameOver(false);
      setCanJump(true);

      // Zerar coins e score ao reviver
      setCoins(0);
      setScore(0);
      setHasPassedPipe(false); // Reiniciar para evitar contagem duplicada

      const mario = document.querySelector('.mario');
      const pipe = document.querySelector('.pipe');

      mario.src = equippedItem ? equippedItem.image : marioGif; // Usar o item equipado
      mario.style.width = '150px';
      mario.style.marginLeft = '0';
      mario.style.bottom = '0';

      pipe.style.animation = 'pipe-animation 2s infinite linear';
      pipe.style.left = '';

      mario.classList.remove('jump');

      setTimeout(() => {
        pipe.style.animation = 'pipe-animation 2s infinite linear';
        mario.style.animation = '';
        mario.src = equippedItem ? equippedItem.image : marioGif; // Usar o item equipado
      }, 100);
    }
  };

  return (
    <div className="game-board">
      <img src={cloudsImg} className="clouds" alt="Clouds" />
      <div className="lives">
        {[...Array(lives)].map((_, index) => (
          <img key={index} src={heartImg} className="heart" alt="Heart" />
        ))}
      </div>
      <img src={equippedItem ? equippedItem.image : marioGif} className="mario" alt="Mario" /> 
      <img src={pipeImg} className="pipe" alt="Pipe" />
      <div className="score welcome-text">Score: {score}</div>
      <div className="coins welcome-text">Coins: {coins}</div>
      <div className="username welcome-text">Usuário: {username}</div>
      {coinPosition.visible && (
        <img
          src={coinImg}
          className="coin"
          alt="Coin"
          style={{
            position: 'absolute',
            left: `${coinPosition.left}px`,
            bottom: `${coinPosition.bottom}px`,
            width: '30px'
          }}
        />
      )}
      {isGameOver && (
        <div className="game-over-modal">
          <div className="game-over-content">
            <h1 className='welcome'>Game Over</h1>
           
            <p className='welcome-text'>Score: {score}</p>
            <p className='welcome-text'>Coins: {coins}</p>
            <button onClick={resetGame}>Tentar Novamente</button>
            {lives > 0 && <button onClick={revive}>Reviver</button>}
          </div>
        </div>
      )}
    </div>
  );
};

export default GameBoard;
