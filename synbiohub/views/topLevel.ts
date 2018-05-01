import { getType } from '../query/type';
import async from 'async';
import config from '../config';
import collection from './collection';
import componentDefinition from './componentDefinition';
import moduleDefinition from './moduleDefinition';
import sequence from './sequence';
import model from './model';
import attachment from './attachment';
import sbolAttachment from './sbolAttachment';
import genericTopLevel from './genericTopLevel';
import activity from './activity';
import agent from './agent';
import plan from './plan';
import implementation from './implementation';
import test from './test';
import pug from 'pug';
import getUrisFromReq from '../getUrisFromReq';

export default async function(req, res) {

    const { graphUri, uri, designId } = getUrisFromReq(req, res);

    let result = await getType(uri, graphUri)

    console.log(result)

    if(result==='http://sbols.org/v2#Collection') {
        collection(req, res)
        return
    } else if(result==='http://sbols.org/v2#ComponentDefinition') {
        componentDefinition(req, res)
        return
    } else if(result==='http://sbols.org/v2#ModuleDefinition') {
        moduleDefinition(req, res)
        return
    } else if(result==='http://sbols.org/v2#Sequence') {
        sequence(req, res)
        return
    } else if(result==='http://sbols.org/v2#Model') {
        model(req, res)
        return
    } else if(result==='http://sbols.org/v2#Attachment') {
        sbolAttachment(req, res)
        return
    } else if(result==='http://www.w3.org/ns/prov#Activity') {
        activity(req, res)
        return
    } else if(result==='http://www.w3.org/ns/prov#Agent') {
        agent(req, res)
        return
    } else if(result==='http://www.w3.org/ns/prov#Plan') {
        plan(req, res)
        return
    } else if(result==='http://wiki.synbiohub.org/wiki/Terms/synbiohub#Attachment') {
        attachment(req, res)
        return
    } else if(result==='http://sbols.org/v2#Implementation') {
        implementation(req, res)
        return
    } else if(result==='http://intbio.ncl.ac.uk#Test') {
        test(req, res)
        return
    } else {
        genericTopLevel(req, res)
        return

    }
};


