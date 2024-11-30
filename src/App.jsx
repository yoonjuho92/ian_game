import GameComponent from './components/Game';

const App = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="p-4 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4 text-center">이안이의 게임</h1>
        <GameComponent />
      </div>
    </div>
  );
};

export default App;