import React from 'react';
import Relay from 'react-relay';
import MyComponent from "./my-component";

const relayComponent = Relay.createContainer(
    MyComponent,
    {
        fragments: {
            ship: () => Relay.QL`
                fragment on Ship {
                    name
                }
            `,
        }
    }
);

export default relayComponent;
