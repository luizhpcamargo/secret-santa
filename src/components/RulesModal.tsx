import { useState, useEffect } from "react";
import { X, Plus, Link, LinkBreak } from "@phosphor-icons/react";
import { Group, Participant, Rule, WishItem } from '../types';
import { useTranslation } from 'react-i18next';
import { produce } from "immer";

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  participantId: string;
  participants: Record<string, Participant>;
  groups: Record<string, Group>;
  onChangeParticipants: (newParticipants: Record<string, Participant>) => void;
}

export function RulesModal({
  isOpen,
  onClose,
  participantId,
  participants,
  groups,
  onChangeParticipants,
}: RulesModalProps) {
  const { t } = useTranslation();
  const participant = participants[participantId];
  const [localRules, setLocalRules] = useState<Rule[]>(participant.rules);
  const [localHint, setLocalHint] = useState<string>(participant.hint || '');
  const [localWishlist, setLocalWishlist] = useState<WishItem[]>(participant.wishlist ?? []);
  const [localGroupId, setLocalGroupId] = useState<string>(participant.groupId ?? '');

  // Add escape key handler
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, onClose]);

  const addRule = (type: 'must' | 'mustNot') => {
    setLocalRules([...localRules, { type, targetParticipantId: '' }]);
  };

  const updateRule = (index: number, targetParticipantId: string) => {
    const newRules = [...localRules];
    newRules[index].targetParticipantId = targetParticipantId;
    setLocalRules(newRules);
  };

  const removeRule = (index: number) => {
    setLocalRules(localRules.filter((_, i) => i !== index));
  };

  const addWish = () => {
    setLocalWishlist([...localWishlist, { text: '' }]);
  };

  const updateWish = (index: number, patch: Partial<WishItem>) => {
    setLocalWishlist(localWishlist.map((item, i) => i === index ? { ...item, ...patch } : item));
  };

  const removeWish = (index: number) => {
    setLocalWishlist(localWishlist.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const wishlist = localWishlist
      .map(({ text, url, price }): WishItem => ({
        text: text.trim(),
        url: url?.trim() || undefined,
        price: price?.trim() || undefined,
      }))
      .filter(item => item.text);

    onChangeParticipants(produce(participants, draft => {
      draft[participantId].rules = localRules;
      draft[participantId].hint = localHint || undefined;
      draft[participantId].wishlist = wishlist.length > 0 ? wishlist : undefined;
      draft[participantId].groupId = groups[localGroupId] ? localGroupId : undefined;
    }));
    onClose();
  };

  const hasMustRule = localRules.some(rule => rule.type === 'must');
  const hasMustNotRule = localRules.some(rule => rule.type === 'mustNot');

  if (!isOpen)
      return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {t('rules.title', { name: participant.name })}
        </h2>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('rules.hintLabel')}
          </label>
          <input
            type="text"
            value={localHint}
            onChange={(e) => setLocalHint(e.target.value)}
            placeholder={t('rules.hintPlaceholder')}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('rules.wishlistLabel')}
          </label>
          <p className="mb-2 text-xs text-gray-500">{t('rules.wishlistHelp')}</p>
          <div className="space-y-2">
            {localWishlist.map((item, index) => (
              <div key={index} className="flex flex-wrap gap-2 items-center">
                <input
                  type="text"
                  value={item.text}
                  onChange={(e) => updateWish(index, { text: e.target.value })}
                  placeholder={t('rules.wishTextPlaceholder')}
                  className="flex-[2_2_12rem] min-w-0 p-2 border rounded"
                />
                <input
                  type="text"
                  value={item.url ?? ''}
                  onChange={(e) => updateWish(index, { url: e.target.value })}
                  placeholder={t('rules.wishUrlPlaceholder')}
                  className="flex-[2_2_8rem] min-w-0 p-2 border rounded"
                />
                <input
                  type="text"
                  value={item.price ?? ''}
                  onChange={(e) => updateWish(index, { price: e.target.value })}
                  placeholder={t('rules.wishPricePlaceholder')}
                  className="flex-[1_1_5rem] min-w-0 p-2 border rounded"
                />
                <button
                  onClick={() => removeWish(index)}
                  className="p-2 text-red-500 hover:text-red-700"
                  aria-label={t('rules.removeWish')}
                >
                  <X size={20} weight="bold" />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={addWish}
            className="mt-2 w-full p-2 bg-blue-500 hover:bg-blue-600 text-white rounded flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            {t('rules.addWish')}
          </button>
        </div>

        {Object.keys(groups).length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('rules.groupLabel')}
            </label>
            <select
              value={groups[localGroupId] ? localGroupId : ''}
              onChange={(e) => setLocalGroupId(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">{t('rules.noGroup')}</option>
              {Object.values(groups).map(group => (
                <option key={group.id} value={group.id}>{group.name || t('settings.unnamedGroup')}</option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-4 mb-6">
          {localRules.map((rule, index) => (
            <div key={index} className="flex gap-2 items-center">
              <span>
                {rule.type === 'must' 
                  ? t('rules.mustBePairedWith')
                  : t('rules.mustNotBePairedWith')
                }
              </span>
              <select
                value={rule.targetParticipantId}
                onChange={(e) => updateRule(index, e.target.value)}
                className="flex-1 p-2 border rounded"
              >
                <option value="">{t('rules.selectParticipant')}</option>
                {Object.values(participants)
                  .filter(p => p.id !== participantId)
                  .map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))
                }
              </select>
              <button
                onClick={() => removeRule(index)}
                className="p-2 text-red-500 hover:text-red-700"
                aria-label={t('rules.removeRule')}
              >
                <X size={20} weight="bold" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => addRule('must')}
            disabled={hasMustNotRule}
            className={`flex-1 p-2 rounded flex items-center justify-center gap-2
              ${hasMustNotRule 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600'} text-white`}
          >
            <Link size={20} />
            {t('rules.addMustRule')}
          </button>
          <button
            onClick={() => addRule('mustNot')}
            disabled={hasMustRule}
            className={`flex-1 p-2 rounded flex items-center justify-center gap-2
              ${hasMustRule 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-red-500 hover:bg-red-600'} text-white`}
          >
            <LinkBreak size={20} />
            {t('rules.addMustNotRule')}
          </button>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            {t('rules.cancel')}
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            {t('rules.saveRules')}
          </button>
        </div>
      </div>
    </div>
  );
} 