import { Initial } from "./Initial";
import { LocaleData } from "./type";
import { history } from "./router";
import { makeAutoObservable } from "mobx";
import { normalize } from "./functions";

export class GlobalState {
  public pathname: string = normalize(history.location.pathname);
  public page: null | React.ReactNode = (<Initial />);
  public lang: string = "en-US";
  public locale: LocaleData | null = null;
  public loading: boolean = false;
  public githubToken: string = "";
  public githubFolder: string = "";
  public githubOwner: string = "nyhxiaoning";
  public githubRepo: string = "gallary_d";
  constructor() {
    makeAutoObservable(this);
  }
}

export const gstate = new GlobalState();
