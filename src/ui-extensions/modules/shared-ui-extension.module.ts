import { NgModule } from '@angular/core';
import { addNavMenuSection } from '@vendure/admin-ui/core';

/**
 * This module adds a new nav menu section linking to the Vue app and React app routes.
 */
@NgModule({
    providers: [
        addNavMenuSection({
            id: 'payments',
            label: 'Payments',
            items: [
                {
                    id: 'your-account',
                    label: 'Your Account',
                    routerLink: ['/extensions/react-ui'],
                    icon: 'payment',
                }
            ],
        }),
    ],
})
export class UiSharedModule {}
