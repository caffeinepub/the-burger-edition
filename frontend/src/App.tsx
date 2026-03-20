import { createRouter, RouterProvider, createRootRoute, createRoute, Outlet } from '@tanstack/react-router';
import Layout from './components/Layout';
import GameLobby from './pages/GameLobby';
import SnakeGame from './pages/SnakeGame';
import TicTacToeGame from './pages/TicTacToeGame';
import MemoryMatchGame from './pages/MemoryMatchGame';
import StickmanArchersGame from './pages/StickmanArchersGame';
import OvoGame from './pages/OvoGame';
import SuperMarioGame from './pages/SuperMarioGame';
import PokemonGame from './pages/PokemonGame';
import SlopeGame from './pages/SlopeGame';
import OneLolGame from './pages/OneLolGame';
import MinecraftClassicGame from './pages/MinecraftClassicGame';
import RetroBowlGame from './pages/RetroBowlGame';
import AmongUsGame from './pages/AmongUsGame';
import FnafGame from './pages/FnafGame';
import RocketSoccerLeagueGame from './pages/RocketSoccerLeagueGame';
import RocketSoccerDerbyGame from './pages/RocketSoccerDerbyGame';
import F19FlightSimulatorGame from './pages/F19FlightSimulatorGame';

const rootRoute = createRootRoute({
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  ),
});

const lobbyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: GameLobby,
});

const snakeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/snake',
  component: SnakeGame,
});

const ticTacToeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tic-tac-toe',
  component: TicTacToeGame,
});

const memoryMatchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/memory-match',
  component: MemoryMatchGame,
});

const stickmanArchersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/stickman-archers',
  component: StickmanArchersGame,
});

const ovoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/ovo',
  component: OvoGame,
});

const superMarioRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/super-mario',
  component: SuperMarioGame,
});

const pokemonRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/pokemon',
  component: PokemonGame,
});

const slopeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/slope',
  component: SlopeGame,
});

const oneLolRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/1v1-lol',
  component: OneLolGame,
});

const minecraftClassicRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/minecraft-classic',
  component: MinecraftClassicGame,
});

const retroBowlRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/retro-bowl',
  component: RetroBowlGame,
});

const amongUsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/among-us',
  component: AmongUsGame,
});

const fnafRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/fnaf',
  component: FnafGame,
});

const rocketSoccerLeagueRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/rocket-soccer-league',
  component: RocketSoccerLeagueGame,
});

const rocketSoccerDerbyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/rocket-soccer-derby',
  component: RocketSoccerDerbyGame,
});

const f19FlightSimulatorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/f19-flight-simulator',
  component: F19FlightSimulatorGame,
});

const routeTree = rootRoute.addChildren([
  lobbyRoute,
  snakeRoute,
  ticTacToeRoute,
  memoryMatchRoute,
  stickmanArchersRoute,
  ovoRoute,
  superMarioRoute,
  pokemonRoute,
  slopeRoute,
  oneLolRoute,
  minecraftClassicRoute,
  retroBowlRoute,
  amongUsRoute,
  fnafRoute,
  rocketSoccerLeagueRoute,
  rocketSoccerDerbyRoute,
  f19FlightSimulatorRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
