import React, {useEffect, useState} from "react";
import { graphQlMutation, graphQlQuery, notify } from '@vendure/ui-devkit';
import { Subscription } from 'rxjs';

const StripeConnect = (props:Object)=>{

    const [connectLink, setConnectLink] = useState();

    useEffect (()=>{
        const getConnect = async()=>{
            const response = await fetch('/connect', {
                    method: 'POST',
                    headers: {
                    'Content-Type': 'application/json',
                },
            })
            const result = await response.json()
            const {link={}} = result;
            setConnectLink(link.url)
        }
        getConnect();
    },[])

    return <>
        <a target="_top" href={connectLink} className={`btn btn-primary ${connectLink ? "" : "disabled"}`}>connect your account</a>
    </>
}


export default StripeConnect