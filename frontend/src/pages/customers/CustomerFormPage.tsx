import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Building2 } from 'lucide-react';
import { customerService } from '../../services/customerService';
import { CustomerType, CustomerStatus } from '../../types';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Button } from '../../components/common/Button';
import { AlertMessage } from '../../components/common/AlertMessage';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const CustomerFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [customerType, setCustomerType] = useState<CustomerType>('WHOLESALE');
  const [status, setStatus] = useState<CustomerStatus>('LEAD');
  const [address, setAddress] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [notes, setNotes] = useState('');

  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEditing && id) {
      async function loadCustomer() {
        try {
          setIsLoading(true);
          const c = await customerService.getCustomerById(id!);
          setName(c.name);
          setBusinessName(c.businessName);
          setMobile(c.mobile);
          setEmail(c.email);
          setGstNumber(c.gstNumber || '');
          setCustomerType(c.customerType);
          setStatus(c.status);
          setAddress(c.address);
          setFollowUpDate(c.followUpDate ? c.followUpDate.split('T')[0] : '');
          setNotes(c.notes || '');
        } catch (err: any) {
          setError(err.response?.data?.message || 'Failed to load customer profile for editing.');
        } finally {
          setIsLoading(false);
        }
      }
      loadCustomer();
    }
  }, [id, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !businessName.trim() || !mobile.trim() || !email.trim() || !address.trim()) {
      setError('Please fill in all mandatory customer fields marked with *');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const payload = {
        name: name.trim(),
        businessName: businessName.trim(),
        mobile: mobile.trim(),
        email: email.trim(),
        gstNumber: gstNumber.trim() || null,
        customerType,
        status,
        address: address.trim(),
        followUpDate: followUpDate || null,
        notes: notes.trim() || null,
      };

      if (isEditing && id) {
        await customerService.updateCustomer(id, payload);
        navigate(`/customers/${id}`);
      } else {
        const created = await customerService.createCustomer(payload);
        navigate(`/customers/${created.id}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save customer record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading customer details..." />;
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/customers">
            <Button variant="secondary" size="sm" icon={<ArrowLeft size={16} />}>
              Back
            </Button>
          </Link>
          <div>
            <h1 className="page-title">{isEditing ? 'Edit Customer' : 'Add New Customer'}</h1>
            <p className="page-subtitle">
              {isEditing ? 'Update profile information and contact details' : 'Register a new customer account or prospective lead'}
            </p>
          </div>
        </div>
      </div>

      {error && <AlertMessage type="danger" message={error} />}

      <div className="card">
        <div className="card-header">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Building2 size={18} color="#4f46e5" />
            Customer Information Form
          </h3>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <Input
                label="Contact Person Name"
                placeholder="e.g. Rahul Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                label="Business / Enterprise Name"
                placeholder="e.g. Apex Electricals Pvt Ltd"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <Input
                label="Mobile Contact Number"
                placeholder="+91 98765 43210"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required
              />
              <Input
                label="Official Email Address"
                type="email"
                placeholder="procurement@apexelectricals.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <Input
                label="GST Identification Number (GSTIN)"
                placeholder="27AABCU9603R1ZM (Optional)"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value)}
                helperText="Leave empty if unregistered retail customer"
              />
              <Select
                label="Customer Category / Type"
                value={customerType}
                onChange={(e) => setCustomerType(e.target.value as CustomerType)}
                options={[
                  { value: 'DISTRIBUTOR', label: 'Distributor' },
                  { value: 'WHOLESALE', label: 'Wholesale Buyer' },
                  { value: 'RETAIL', label: 'Retail Customer' },
                ]}
                required
              />
            </div>

            <div className="form-row">
              <Select
                label="Relationship Pipeline Status"
                value={status}
                onChange={(e) => setStatus(e.target.value as CustomerStatus)}
                options={[
                  { value: 'LEAD', label: 'Lead (Prospective)' },
                  { value: 'ACTIVE', label: 'Active (Engaged Customer)' },
                  { value: 'INACTIVE', label: 'Inactive / Dormant' },
                ]}
                required
              />
              <Input
                label="Next Target Follow-up Date"
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                helperText="Optional schedule for sales reminders"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Complete Billing & Shipping Address <span className="required">*</span>
              </label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Street address, Industrial area, City, State, PIN code..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Account Notes & Commercial Preferences</label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Add background context, requested discount terms, delivery requirements..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <Button type="button" variant="secondary" onClick={() => navigate('/customers')}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting} icon={<Save size={16} />}>
                {isEditing ? 'Update Customer' : 'Create Customer'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
