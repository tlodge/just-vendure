#!/bin/bash
stripe listen --forward-to http://localhost:3000/stripe-webhook
