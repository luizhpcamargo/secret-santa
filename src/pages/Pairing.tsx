import "@fontsource/dancing-script/700.css";
import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { decodeReceiver } from '../utils/receiverPayload';
import { PostCard } from '../components/PostCard';
import { Trans, useTranslation } from 'react-i18next';
import { MenuItem, SideMenu } from '../components/SideMenu';
import { PageTransition } from '../components/PageTransition';
import { ArrowLeft, ArrowSquareOut, Gift, Info } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import CryptoJS from 'crypto-js';
import { Layout } from "../components/Layout";
import { ReceiverData } from "../types";

async function loadPairing(searchParams: URLSearchParams): Promise<[string, ReceiverData]> {
  // Legacy pairings, not generated anymore; remove after 2025-01-01
  if (searchParams.has(`name`) && searchParams.has(`key`) && searchParams.has(`pairing`)) {
    const name = searchParams.get(`name`)!;
    const key = searchParams.get(`key`)!;
    const pairing = searchParams.get(`pairing`)!;

    return [name, {name: CryptoJS.AES.decrypt(pairing, key).toString(CryptoJS.enc.Utf8)}];
  }

  if (searchParams.has(`to`)) {
    const from = searchParams.get('from')!;
    const to = searchParams.get('to')!;
    return [from, await decodeReceiver(to)];
  }

  throw new Error(`Missing key or to parameter in search params`);
}

// Links come from the URL, so only ever render real web links
function isSafeUrl(value: string) {
  try {
    return [`http:`, `https:`].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

export function Pairing() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignment, setAssignment] = useState<[string, ReceiverData] | null>(null);
  const [instructions, setInstructions] = useState<string | null>(null);

  useEffect(() => {
    const decryptReceiver = async () => {
      try {
        setAssignment(await loadPairing(searchParams));
        setInstructions(searchParams.get('info'));
      } catch (err) {
        console.error('Decryption error:', err);
        setError(t('pairing.error'));
      } finally {
        setLoading(false);
      }
    };

    decryptReceiver();
  }, [searchParams, t]);

  if (error) {
    return (
      <div className="min-h-screen bg-red-700 flex items-center justify-center">
        <div className="text-xl text-white">{error}</div>
      </div>
    );
  }

  const menuItems = [
    <MenuItem key={`back`} to="/" icon={<ArrowLeft weight={`bold`}/>}>
      {t('pairing.startYourOwn')}
    </MenuItem>
  ];

  return (
    <Layout menuItems={menuItems}>
      <div>
        {!loading && assignment && (
          <motion.div
            initial={{ rotateZ: -360 * 1, scale: 0 }}
            animate={{ rotateZ: 0, scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ ease: `easeIn`, duration: .6 }}
          >
            <PostCard>
              <h1 className="text-3xl font-bold mb-6 text-center text-red-700">
                {t('pairing.title')}
              </h1>
              <p className="mb-6 text-center text-gray-600">
                <Trans
                  i18nKey="pairing.assignment"
                  components={{
                    name: <span className="font-semibold">{assignment![0]}</span>
                  }}
                />
              </p>
              <div className="text-8xl font-bold text-center p-6 font-dancing-script">
                {assignment[1].name}
              </div>
              {(instructions || assignment[1].hint) && (
                <div className="mt-6 flex p-4 bg-gray-50 rounded-lg leading-6 text-gray-600 whitespace-pre-wrap">
                  <div className="mr-4">
                    <Info size={24}/>
                  </div>
                  <div className="space-y-2">
                    {assignment[1].hint && <p>{assignment[1].hint}</p>}
                    {instructions && <p>{instructions}</p>}
                  </div>
                </div>
              )}
              {!!assignment[1].wishlist?.length && (
                <div className="mt-6">
                  <h2 className="flex items-center gap-2 mb-3 text-lg font-bold text-red-700">
                    <Gift size={22} weight="bold"/>
                    {t('pairing.wishlistTitle', { name: assignment[1].name })}
                  </h2>
                  <ul className="space-y-2">
                    {assignment[1].wishlist.map((item, index) => (
                      <li key={index} className="flex items-baseline justify-between gap-3 p-3 bg-gray-50 rounded-lg text-gray-700">
                        <span className="min-w-0 break-words">{item.text}</span>
                        <span className="flex flex-none items-center gap-3">
                          {item.price && <span className="text-gray-500">{item.price}</span>}
                          {item.url && isSafeUrl(item.url) && (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-blue-500 underline"
                            >
                              {t('pairing.wishlistLink')}
                              <ArrowSquareOut size={14} weight="bold"/>
                            </a>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </PostCard>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}
