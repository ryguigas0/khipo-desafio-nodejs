import { Router } from "express";

export interface Controller {
  controller: Router;
  route: string;
}
