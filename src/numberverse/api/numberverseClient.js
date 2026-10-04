import {
  startDevelopmentChallenge,
  submitDevelopmentResponse,
} from "../adapters/developmentAdapter";

export async function startChallenge(request) {
  return startDevelopmentChallenge(request);
}

export async function submitResponse(request) {
  return submitDevelopmentResponse(request);
}
