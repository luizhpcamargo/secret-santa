import { Plus, X } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { produce } from 'immer';
import { Group } from '../types';

interface SettingsProps {
  instructions: string;
  onChangeInstructions: (instructions: string) => void;
  groups: Record<string, Group>;
  onChangeGroups: (groups: Record<string, Group>) => void;
}

export function Settings({ instructions, onChangeInstructions, groups, onChangeGroups }: SettingsProps) {
  const { t } = useTranslation();

  const groupList = Object.values(groups);

  const addGroup = () => {
    const id = crypto.randomUUID();
    onChangeGroups({...groups, [id]: {id, name: ''}});
  };

  const renameGroup = (id: string, name: string) => {
    onChangeGroups(produce(groups, draft => {
      draft[id].name = name;
    }));
  };

  const removeGroup = (id: string) => {
    onChangeGroups(produce(groups, draft => {
      delete draft[id];

      for (const group of Object.values(draft)) {
        if (group.canDraw) {
          group.canDraw = group.canDraw.filter(target => target !== id);
        }
      }
    }));
  };

  const toggleCanDraw = (id: string, targetId: string) => {
    onChangeGroups(produce(groups, draft => {
      const current = new Set(draft[id].canDraw ?? Object.keys(draft));

      if (current.has(targetId)) {
        current.delete(targetId);
      } else {
        current.add(targetId);
      }

      // Drawing from every group is the default, so we don't need to store it
      draft[id].canDraw = Object.keys(draft).every(key => current.has(key))
        ? undefined
        : Array.from(current);
    }));
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="mb-2">
          <h4 className="block text-sm font-medium text-gray-700">
            {t('settings.instructions')}
          </h4>
          <p className="mt-1 text-xs text-gray-500">
            {t('settings.instructionsHelp')}
          </p>
        </div>
        <textarea
          value={instructions}
          onChange={(e) => onChangeInstructions(e.target.value)}
          className="w-full p-2 border rounded min-h-[100px]"
          placeholder={t('settings.instructionsPlaceholder')}
        />
      </div>

      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="mb-2">
          <h4 className="block text-sm font-medium text-gray-700">
            {t('settings.groups')}
          </h4>
          <p className="mt-1 text-xs text-gray-500">
            {t('settings.groupsHelp')}
          </p>
        </div>

        <div className="space-y-3">
          {groupList.map(group => (
            <div key={group.id} className="p-3 bg-white border rounded space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={group.name}
                  onChange={(e) => renameGroup(group.id, e.target.value)}
                  placeholder={t('settings.groupNamePlaceholder')}
                  className="flex-1 min-w-0 p-2 border rounded"
                />
                <button
                  onClick={() => removeGroup(group.id)}
                  className="px-2 sm:px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex-shrink-0"
                  aria-label={t('settings.removeGroup')}
                >
                  <X className="h-4" weight="bold" />
                </button>
              </div>

              {groupList.length > 0 && (
                <fieldset>
                  <legend className="mb-1 text-xs text-gray-500">{t('settings.canDraw')}</legend>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {groupList.map(target => (
                      <label key={target.id} className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={group.canDraw ? group.canDraw.includes(target.id) : true}
                          onChange={() => toggleCanDraw(group.id, target.id)}
                        />
                        {target.name || t('settings.unnamedGroup')}
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addGroup}
          className="mt-3 w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center gap-2"
        >
          <Plus size={20} weight="bold" />
          {t('settings.addGroup')}
        </button>
      </div>
    </div>
  );
}
