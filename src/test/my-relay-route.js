import Relay from 'react-relay';

export default {
    name: 'Greeter',
    queries: {
        ship: () => Relay.QL`
            query getShip { ship(id:$id) }
        `
    }
}
