// server/index.ts
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieSession from 'cookie-session';
import { google } from 'googleapis';
import dotenv from 'dotenv';

// .env の読み込み
dotenv.config();

const app = express();
const PORT = 3000;

// セッションのセットアップ（今回はシンプルなCookieセッションを利用）
app.use(
  cookieSession({
    name: 'session',
    keys: ['your-secret-key'], // よりセキュアなキーを設定してください
    maxAge: 24 * 60 * 60 * 1000, // 24時間
  })
);

// CORS の設定（フロントエンドとの連携のため）
app.use(
  cors({
    origin: 'http://localhost:5173', // フロントエンド(Vite)のポートに合わせる
    credentials: true,
  })
);

// Google OAuth2.0 クライアントの設定
const CLIENT_ID = process.env.CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
const CLIENT_SECRET = process.env.CLIENT_SECRET || 'YOUR_GOOGLE_CLIENT_SECRET';
const REDIRECT_URI = 'http://localhost:3000/auth/google/callback'; // Google Cloud Console と合わせる

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// ユーザ情報取得のスコープ設定
const scopes = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email'
];

// 認証フロー開始エンドポイント
app.get(
  '/auth/google',
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent'
      });
      res.redirect(authUrl);
    } catch (error) {
      next(error);
    }
  }
);

// OAuth2 コールバックエンドポイント
app.get(
  '/auth/google/callback',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const code = req.query.code as string;
    if (!code) {
      res.status(400).send('認証コードがありません');
      return;
    }
    try {
      // 認証コードからアクセストークンを取得
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);
      
      // ユーザー情報を取得
      const oauth2 = google.oauth2({
        auth: oauth2Client,
        version: 'v2',
      });
      const userInfoResponse = await oauth2.userinfo.get();
      const user = userInfoResponse.data;
      
      // セッションにトークンやユーザー情報を保存
      req.session!.tokens = tokens;
      req.session!.user = user;
      
      // フロントエンド（Vite サーバー）にリダイレクト
      res.redirect('http://localhost:5173');
    } catch (error) {
      console.error('アクセストークン取得エラー:', error);
      next(error);
    }
  }
);

// ログインユーザーのプロフィールを取得するためのエンドポイント
app.get(
  '/profile',
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.session || !req.session.user) {
      res.status(401).send('未認証です');
      return;
    }
    res.json(req.session.user);
  }
);

// ログアウトエンドポイント：セッションをクリアしてフロントにリダイレクト
app.get(
  '/logout',
  (req: Request, res: Response, next: NextFunction): void => {
    req.session = null;
    res.redirect('http://localhost:5173');
  }
);

// サーバー起動
app.listen(PORT, () => {
  console.log(`サーバーがポート ${PORT} で起動しました`);
});
