import { consts } from '../const/consts.js';
import config from './index.js'

const getComsumingSqsUrl = () => {
    return config.get('consuming_from_sqs.url') || consts.UNKNOWN;
}

const getNextSqsUrl = () => {
    return config.get('producing_to_sqs.url') || consts.UNKNOWN;
}

export {
    getComsumingSqsUrl,
    getNextSqsUrl,
}